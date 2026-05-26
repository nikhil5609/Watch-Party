import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Play, Pause, Maximize,
  LogOut, Shield, Rewind, FastForward, Copy, Check, Users,
  Mic, MicOff, PhoneCall, PhoneOff, Volume2, VolumeX,
} from "lucide-react";
import { socket } from "../../socket";
import { clearRoomState } from "../../Store/room.slice";

const Theater = ({ member = [], webrtc }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { room } = useSelector((state) => state.room);
  const { user } = useSelector((state) => state.user);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [hoverControls, setHoverControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [micError, setMicError] = useState(null);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const duckFrameRef = useRef(null); // rAF handle for smooth ducking
  const isHost = user?._id === room?.hostId;

  const {
    isInCall, isMuted, callMembers, volumes, isSomeoneSpeaking,
    joinCall, leaveCall, toggleMute, setUserVolume,
  } = webrtc;

  // u2500u2500 auto-ducking u2500u2500
  useEffect(() => {
    if (!isInCall) return;
    const video = videoRef.current;
    if (!video) return;
    const targetVol = isSomeoneSpeaking ? 0.25 : 1.0;
    if (duckFrameRef.current) cancelAnimationFrame(duckFrameRef.current);
    const ramp = () => {
      const diff = targetVol - video.volume;
      if (Math.abs(diff) < 0.01) { video.volume = targetVol; return; }
      video.volume = Math.max(0, Math.min(1, video.volume + diff * 0.12));
      duckFrameRef.current = requestAnimationFrame(ramp);
    };
    duckFrameRef.current = requestAnimationFrame(ramp);
    return () => { if (duckFrameRef.current) cancelAnimationFrame(duckFrameRef.current); };
  }, [isSomeoneSpeaking, isInCall]);

  // ── call handlers ──────────────────────────────────────────────────────

  const handleJoinCall = async () => {
    setMicError(null);
    try {
      await joinCall(user._id, user.username);
    } catch (err) {
      setMicError("Microphone access denied. Please allow mic in browser settings.");
      setTimeout(() => setMicError(null), 5000);
    }
  };

  // ── video helpers ──────────────────────────────────────────────────────

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room?.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!isHost || !video) return;
    const state = video.paused ? "play" : "pause";
    socket.emit("toggle-play", { state, current_time: video.currentTime });
    if (state === "play") {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!isHost || !video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = ((e.clientX - rect.left) / rect.width) * video.duration;
    video.currentTime = newTime;
    socket.emit("toggle-play", {
      state: video.paused ? "pause" : "play",
      current_time: newTime,
    });
  };

  const handleTimer = (time) => {
    const video = videoRef.current;
    if (!video) return;
    const diff = video.currentTime - time;
    if (Math.abs(diff) > 2) {
      video.currentTime = time;
    } else if (Math.abs(diff) > 0.25) {
      video.playbackRate = diff > 0 ? 0.95 : 1.1;
      setTimeout(() => { video.playbackRate = 1; }, 1000);
    }
  };

  const handleSyncRef = useRef(null);
  handleSyncRef.current = (data) => {
    const video = videoRef.current;
    if (!video) return;
    if (data.state === "play") {
      if (video.paused) {
        video.muted = true;
        video.play().then(() => { video.muted = false; }).catch(() => {});
        setIsPlaying(true);
      }
    } else if (data.state === "pause") {
      if (!video.paused) {
        video.pause();
        setIsPlaying(false);
      }
    }
    handleTimer(data.current_time);
  };

  useEffect(() => {
    const handler = (data) => handleSyncRef.current(data);
    socket.on("control", handler);
    socket.emit("request-sync");
    return () => socket.off("control", handler);
  }, []);

  useEffect(() => {
    const handler = (data) => handleSyncRef.current(data);
    socket.on("get-time", handler);
    return () => socket.off("get-time", handler);
  }, []);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const onTimeUpdate = () => {
      setCurrentTime(videoEl.currentTime);
      setProgress((videoEl.currentTime / videoEl.duration) * 100);
    };
    const onMeta = () => setDuration(videoEl.duration);
    videoEl.addEventListener("timeupdate", onTimeUpdate);
    videoEl.addEventListener("loadedmetadata", onMeta);
    return () => {
      videoEl.removeEventListener("timeupdate", onTimeUpdate);
      videoEl.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  useEffect(() => {
    if (!isHost) return;
    const interval = setInterval(() => {
      socket.emit("time-stamp", {
        roomId: room?.roomCode,
        current_time: videoRef.current?.currentTime,
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isHost, room?.roomCode]);

  const leaveRoom = () => {
    if (!window.confirm("Exit the Cinema?")) return;
    if (isInCall) leaveCall();
    socket.emit("leave-room", room?.hostId);
    socket.disconnect();
    navigate("/");
    dispatch(clearRoomState());
  };

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center text-white overflow-hidden select-none font-sans"
      onMouseMove={() => {
        setHoverControls(true);
        clearTimeout(window.controlTimer);
        window.controlTimer = setTimeout(() => setHoverControls(false), 3000);
      }}
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        src={room?.video}
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />

      {/* TOP BAR */}
      <div
        className={`absolute top-0 inset-x-0 p-8 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-700 ${
          hoverControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight text-white/90">
            {room?.video?.name || "Untitled Cinema"}
          </h1>
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
          >
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              {room?.roomCode}
            </span>
            {copied ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} className="text-slate-500" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-xl p-2 rounded-2xl border border-white/5">
          {/* call member avatars */}
          {callMembers.length > 0 && (
            <div className="flex items-center gap-1 px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">
                {callMembers.length + 1} in call
              </span>
            </div>
          )}
          <div className="flex -space-x-2">
            {member.slice(0, 3).map((m, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full border-2 border-black bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold uppercase shadow-xl"
              >
                {m.userId.username.charAt(0)}
              </div>
            ))}
            {member.length > 3 && (
              <div className="w-9 h-9 rounded-full border-2 border-black bg-slate-800 flex items-center justify-center text-xs font-bold">
                +{member.length - 3}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={`p-2 rounded-xl transition-colors ${
              showMembers ? "bg-white text-black" : "hover:bg-white/10"
            }`}
          >
            <Users size={20} />
          </button>
        </div>
      </div>

      {/* SIDEBAR: member list + volume controls */}
      <aside
        className={`absolute right-6 top-24 bottom-24 z-[60] w-72 bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/10 transition-all duration-500 shadow-2xl ${
          showMembers
            ? "translate-x-0 opacity-100"
            : "translate-x-12 opacity-0 pointer-events-none"
        }`}
      >
        <div className="p-6 flex flex-col h-full gap-4">
          {/* Audience */}
          <div className="flex flex-col flex-1 min-h-0">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3 flex items-center gap-2">
              <Shield size={14} /> Audience
            </h2>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
              {member.map((m) => {
                const inCall = callMembers.find(
                  (c) => c.userId === m.userId._id
                );
                return (
                  <div
                    key={m.userId._id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                        {m.userId.username}
                      </span>
                      {inCall && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] inline-block" />
                      )}
                    </div>
                    {m.userId._id === room?.hostId && (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Volume controls — shown only when in call with others */}
          {isInCall && callMembers.length > 0 && (
            <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <Volume2 size={14} /> Voice Volumes
              </h2>
              <div className="space-y-3 overflow-y-auto max-h-48 custom-scrollbar pr-1">
                {callMembers.map(({ socketId, userId, username }) => {
                  const vol = volumes[socketId] ?? 1;
                  const muted = vol === 0;
                  return (
                    <div key={socketId} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 truncate max-w-[130px]">
                          {username ||
                            member.find((m) => m.userId._id === userId)
                              ?.userId?.username ||
                            "Unknown"}
                        </span>
                        <button
                          onClick={() =>
                            setUserVolume(socketId, muted ? 1 : 0)
                          }
                          className={`p-1 rounded-lg transition-colors ${
                            muted
                              ? "text-red-400 hover:bg-red-500/10"
                              : "text-slate-400 hover:bg-white/10"
                          }`}
                        >
                          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={vol}
                        onChange={(e) =>
                          setUserVolume(socketId, parseFloat(e.target.value))
                        }
                        className="w-full h-1 accent-indigo-400 cursor-pointer rounded-full"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MIC ERROR TOAST */}
      {micError && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 bg-red-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl text-sm text-red-200 shadow-xl max-w-xs text-center">
          {micError}
        </div>
      )}

      {/* BOTTOM CONTROLS */}
      <div
        className={`absolute bottom-8 inset-x-0 px-8 flex justify-center transition-all duration-700 ${
          hoverControls
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-12 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-5xl bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-4 shadow-2xl">

          {/* Progress bar */}
          <div
            className="group/progress relative h-1 w-full mb-4 bg-white/20 cursor-pointer flex items-center transition-all duration-150 hover:h-1.5"
            onClick={handleSeek}
          >
            <div className="absolute inset-0 bg-white/10" />
            <div
              className="h-full bg-red-600 relative transition-all duration-75"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full scale-0 group-hover/progress:scale-100 transition-transform duration-150 shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
            </div>
          </div>

          <div className="flex items-center justify-between px-4">
            {/* Left: playback controls + timestamp */}
            <div className="flex items-center gap-6">
              {isHost && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      videoRef.current.currentTime -= 10;
                      socket.emit("toggle-play", {
                        state: videoRef.current.paused ? "pause" : "play",
                        current_time: videoRef.current.currentTime,
                      });
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <Rewind size={22} />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg"
                  >
                    {isPlaying ? (
                      <Pause size={24} fill="black" />
                    ) : (
                      <Play size={24} fill="black" className="ml-1" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      videoRef.current.currentTime += 10;
                      socket.emit("toggle-play", {
                        state: videoRef.current.paused ? "pause" : "play",
                        current_time: videoRef.current.currentTime,
                      });
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <FastForward size={22} />
                  </button>
                </div>
              )}
              <div className="text-sm font-medium tracking-tight font-mono">
                <span className="text-white">{formatTime(currentTime)}</span>
                <span className="mx-2 text-white/20">|</span>
                <span className="text-white/40">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right: voice + fullscreen + exit */}
            <div className="flex items-center gap-2">

              {/* Mute toggle — only while in call */}
              {isInCall && (
                <button
                  onClick={toggleMute}
                  title={isMuted ? "Unmute" : "Mute"}
                  className={`p-3 rounded-2xl transition-all border ${
                    isMuted
                      ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                      : "border-white/10 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}

              {/* Join / Leave call */}
              <button
                onClick={isInCall ? leaveCall : handleJoinCall}
                title={isInCall ? "Leave voice call" : "Join voice call"}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest border ${
                  isInCall
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400"
                    : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
                }`}
              >
                {isInCall ? (
                  <>
                    <PhoneOff size={16} /> Leave
                  </>
                ) : (
                  <>
                    <PhoneCall size={16} /> Join Call
                  </>
                )}
              </button>

              <div className="w-[1px] h-6 bg-white/10 mx-1" />

              <button
                onClick={() => containerRef.current?.requestFullscreen()}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all"
              >
                <Maximize size={20} className="text-slate-300" />
              </button>

              <div className="w-[1px] h-6 bg-white/10 mx-1" />

              <button
                onClick={leaveRoom}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all font-bold text-xs uppercase tracking-widest border border-red-500/20"
              >
                <LogOut size={16} /> Exit
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes toastIn {
            from { transform: translateX(40px); opacity: 0; scale: 0.9; }
            to { transform: translateX(0); opacity: 1; scale: 1; }
          }
          .toast-animation {
            animation: toastIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
          }
        `}
      </style>
    </div>
  );
};

export default Theater;