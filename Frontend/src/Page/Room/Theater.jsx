import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Play, Pause, Mic, MicOff, Volume2, VolumeX, Maximize, ChevronLeft, ChevronRight,
  LogOut, Shield, MonitorUp, Loader2, Rewind, FastForward
} from "lucide-react";
import { socket } from "../../socket";
import { clearRoomState, setVideoState } from "../../Store/room.slice";
import getFileHash from "../../Utility/hashFile";

const Theater = ({ member }) => {
  const { room, video } = useSelector((state) => state.room);
  const { user } = useSelector((state) => state.user);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isPlaying, setIsPlaying] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverControls, setHoverControls] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  // Timeline State
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const isHost = user?._id === room?.hostId;

  // Formatting time (00:00)
  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Sync Progress & Duration
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoEl.currentTime);
      setProgress((videoEl.currentTime / videoEl.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(videoEl.duration);
    };

    videoEl.addEventListener("timeupdate", handleTimeUpdate);
    videoEl.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      videoEl.removeEventListener("timeupdate", handleTimeUpdate);
      videoEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [video]);

  // Host Heartbeat Time Stamp
  useEffect(() => {
    const interval = setInterval(() => {
      if (isHost && videoRef.current && !videoRef.current.paused) {
        socket.emit("time-stamp", { roomId: room?.roomCode, time: videoRef.current.currentTime });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isHost, room?.roomCode]);

  // Warning timer
  useEffect(() => {
    const timer = setTimeout(() => setShowWarning(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Fullscreen & Keyboard Listeners
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === "f") {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
        else document.exitFullscreen();
      }

      // Host specific keys
      if (isHost) {
        if (e.key === "ArrowRight") handleSkip(5);
        if (e.key === "ArrowLeft") handleSkip(-5);
        if (e.key === " ") {
          e.preventDefault();
          togglePlay();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isHost, isPlaying]);

  // Socket sync logic
  useEffect(() => {
    if (!socket || !video) return;
    socket.on("control", handleVideoControl);
    return () => {
      socket.off("control", handleVideoControl);
      socket.off("get-time", handleGetTime);
    };
  }, [video]);

  // Host Actions
  const togglePlay = () => {
    if (!isHost || !videoRef.current) return;
    if (videoRef.current.paused) {
      socket.emit("toggle-play", "play");
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      socket.emit("toggle-play", "paused");
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSkip = (amount) => {
    if (!isHost || !videoRef.current) return;
    const newTime = Math.min(Math.max(videoRef.current.currentTime + amount, 0), videoRef.current.duration);
    videoRef.current.currentTime = newTime;
    socket.emit("time-stamp", { roomId: room?.roomCode, time: newTime });
  };

  const handleSeek = (e) => {
    if (!isHost || !videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedPos = x / rect.width;
    const newTime = clickedPos * videoRef.current.duration;
    videoRef.current.currentTime = newTime;
    socket.emit("time-stamp", { roomId: room?.roomCode, time: newTime });
  };

  const handleVideoControl = async (control) => {
    if (!videoRef.current) return;
    try {
      if (control === "paused") {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) { console.error(err); }
  };

  const handleReverifyFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsVerifying(true);
    const hash = await getFileHash(file);
    if (hash === room.video.hash) {
      const url = URL.createObjectURL(file);
      dispatch(setVideoState(url));
    } else {
      alert("Incorrect file! Please select the same movie file.");
    }
    setIsVerifying(false);
  };

  const handleGetTime = ({ status, time }) => {
    if (!videoRef.current) return;
    const drift = time - videoRef.current.currentTime;
    if (Math.abs(drift) > 0.5 && Math.abs(drift) < 2) {
      videoRef.current.playbackRate = drift > 0 ? 1.05 : 0.95;
      setTimeout(() => { if (videoRef.current) videoRef.current.playbackRate = 1; }, 2000);
    } else if (Math.abs(drift) >= 2) {
      videoRef.current.currentTime = time;
    }
    status === "play" ? videoRef.current.play() : videoRef.current.pause();
  };

  useEffect(() => {
    setInterval(() => {
      socket.on("get-time", handleGetTime);
    }, 2000)
    return () => socket.off("get-time".handleGetTime);
  }, [])

  const leaveRoom = () => {
    if (!window.confirm("Leave the theater?")) return;
    socket.emit("leave-room", room?.hostId);
    socket.disconnect();
    navigate("/");
    dispatch(clearRoomState());
  };

  return (
    <div ref={containerRef} className="w-screen h-screen bg-[#020617] flex text-slate-200 overflow-hidden font-sans"
      onMouseMove={() => {
        setHoverControls(true);
        clearTimeout(window.controlTimer);
        window.controlTimer = setTimeout(() => setHoverControls(false), 3000);
      }}>

      {/* WARNING */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-1000 pointer-events-none ${showWarning ? "opacity-100" : "opacity-0 -translate-y-4"}`}>
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md text-red-500 px-6 py-3 rounded-2xl text-xs font-bold tracking-widest uppercase">
          ⚠️ Warning: Do not refresh this page
        </div>
      </div>

      <aside className={`relative z-40 transition-all duration-500 bg-black/40 backdrop-blur-2xl border-r border-white/5 ${showMembers ? "w-72" : "w-0 overflow-hidden"}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8 text-slate-400">
            <Shield size={18} />
            <h2 className="text-xs font-black tracking-widest uppercase">Audience</h2>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
            {member.map((m) => (
              <div key={m.userId._id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-white/5">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-xs">
                  {m.userId.username.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm font-bold truncate">{m.userId.username} {m.userId._id === room.hostId && "👑"}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 relative flex items-center justify-center bg-black">
        {!video ? (
          <div className="flex flex-col items-center max-w-md text-center p-8">
            <div className="p-6 bg-red-500/10 rounded-full mb-6 border border-red-500/20 shadow-2xl shadow-red-500/10">
              <MonitorUp size={48} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-black mb-4 uppercase">Reconnecting...</h1>
            <p className="text-slate-400 text-sm mb-10 leading-relaxed">
              Please re-select <span className="text-white font-bold">{room?.video?.name}</span> to resume sync.
            </p>
            <label className="w-full h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer border-white/10 hover:border-red-500/50 hover:bg-red-500/5">
              {isVerifying ? <Loader2 className="animate-spin text-red-500" /> : <MonitorUp size={24} />}
              <span className="text-xs font-bold tracking-widest uppercase">{isVerifying ? "Verifying..." : "Select Movie File"}</span>
              <input type="file" hidden accept="video/*" onChange={handleReverifyFile} disabled={isVerifying} />
            </label>
            <button onClick={leaveRoom} className="mt-8 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest">Back to Lobby</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} src={video} className="w-full h-full object-contain" onClick={togglePlay} />

            <button onClick={() => setShowMembers(!showMembers)} className={`absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/5 border border-white/10 rounded-full transition-opacity ${!hoverControls && isFullscreen ? "opacity-0" : "opacity-100"}`}>
              {showMembers ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>

            <div className={`absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-500 pointer-events-none z-30 ${hoverControls ? "opacity-100" : "opacity-0"}`}>
              <p className="text-[10px] font-black tracking-widest text-red-600 uppercase">Room: {room?.roomCode}</p>
              <h1 className="text-lg font-bold text-white/90 truncate max-w-xl">{room?.video?.name}</h1>
            </div>

            {/* PLAYER CONTROLS BOX */}
            <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 flex flex-col items-center gap-4 w-[90%] max-w-4xl px-8 py-5 bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 ${hoverControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>

              {/* TIMELINE SECTION */}
              <div className="w-full flex items-center gap-4">
                <span className="text-[10px] font-mono text-slate-400 w-12">{formatTime(currentTime)}</span>
                <div
                  className={`relative h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden ${isHost ? "cursor-pointer" : "cursor-not-allowed"}`}
                  onClick={handleSeek}
                >
                  <div className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-150" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] font-mono text-slate-400 w-12 text-right">{formatTime(duration)}</span>
              </div>

              {/* BUTTONS SECTION */}
              <div className="flex items-center gap-4">
                {isHost && (
                  <>
                    <button onClick={() => handleSkip(-5)} className="p-3 text-slate-400 hover:text-white transition-colors" title="Back 5s">
                      <Rewind size={22} />
                    </button>
                    <button onClick={togglePlay} className="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl shadow-white/10">
                      {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                    </button>
                    <button onClick={() => handleSkip(5)} className="p-3 text-slate-400 hover:text-white transition-colors" title="Forward 5s">
                      <FastForward size={22} />
                    </button>
                  </>
                )}

                <div className="h-8 w-[1px] bg-white/10 mx-2" />

                <button onClick={() => setMicOn(!micOn)} className={`p-3.5 rounded-2xl transition-all ${micOn ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button onClick={() => setSpeakerOn(!speakerOn)} className={`p-3.5 rounded-2xl transition-all ${speakerOn ? "bg-blue-500/10 text-blue-500" : "bg-slate-700/50 text-slate-400"}`}>
                  {speakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                <button onClick={() => containerRef.current?.requestFullscreen()} className="p-3.5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10"><Maximize size={20} /></button>

                <div className="h-8 w-[1px] bg-white/10 mx-2" />

                <button onClick={leaveRoom} className="p-3.5 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl transition-all">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Theater;