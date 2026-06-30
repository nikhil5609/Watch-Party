import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Play, Pause, Maximize, Minimize,
  LogOut, Shield, Rewind, FastForward, Copy, Check, Users,
  Mic, MicOff, PhoneCall, PhoneOff, Volume2, VolumeX, Volume1,
  Share2, X, Instagram, Youtube, Send,
} from "lucide-react";
import { socket } from "../../socket";
import { clearRoomState } from "../../Store/room.slice";

const fmt = (t) => {
  if (isNaN(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const Avatar = ({ name = "?", size = 36, ring = false }) => (
  <div
    className={`flex items-center justify-center rounded-full flex-shrink-0 font-bold text-white bg-gradient-to-br from-indigo-500 to-violet-500 ${ring ? "border-2 border-black" : ""}`}
    style={{ width: size, height: size, fontSize: size * 0.38 }}
  >
    {name.charAt(0).toUpperCase()}
  </div>
);
const VolIcon = ({ v, size = 18 }) => {
  if (v === 0) return <VolumeX size={size} />;
  if (v < 0.5) return <Volume1 size={size} />;
  return <Volume2 size={size} />;
};

const Theater = ({ member = [], webrtc }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { room } = useSelector((s) => s.room);
  const { user }  = useSelector((s) => s.user);

  const [isPlaying,    setIsPlaying]    = useState(false);
  const [showMembers,  setShowMembers]  = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress,     setProgress]     = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [copied,       setCopied]       = useState(false);
  const [micError,     setMicError]     = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [movieVol,     setMovieVol]     = useState(1);
  const [movieMuted,   setMovieMuted]   = useState(false);
  const [isMobile,     setIsMobile]     = useState(false);
  const [showShare,    setShowShare]    = useState(false);
  const [shareCopied,  setShareCopied]  = useState(false);

  const videoRef      = useRef(null);
  const containerRef  = useRef(null);
  const duckFrameRef  = useRef(null);
  const hideTimerRef  = useRef(null);
  const isHost = user?._id === room?.hostId;

  const {
    isInCall, isMuted, callMembers, volumes, isSomeoneSpeaking,
    joinCall, leaveCall, toggleMute, setUserVolume,
  } = webrtc;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => clearTimeout(hideTimerRef.current);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      resetHideTimer();
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      if (e.key === "ArrowLeft")  { if (isHost && videoRef.current) videoRef.current.currentTime -= 10; }
      if (e.key === "ArrowRight") { if (isHost && videoRef.current) videoRef.current.currentTime += 10; }
      if (e.key === "m" || e.key === "M") {
        setMovieMuted((p) => !p);
        if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isHost]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (!isInCall) return;
    const video = videoRef.current;
    if (!video) return;
    const target = isSomeoneSpeaking ? 0.25 : movieVol;
    if (duckFrameRef.current) cancelAnimationFrame(duckFrameRef.current);
    const ramp = () => {
      const diff = target - video.volume;
      if (Math.abs(diff) < 0.01) { video.volume = target; return; }
      video.volume = Math.max(0, Math.min(1, video.volume + diff * 0.12));
      duckFrameRef.current = requestAnimationFrame(ramp);
    };
    duckFrameRef.current = requestAnimationFrame(ramp);
    return () => { if (duckFrameRef.current) cancelAnimationFrame(duckFrameRef.current); };
  }, [isSomeoneSpeaking, isInCall, movieVol]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = movieMuted ? 0 : movieVol;
    videoRef.current.muted  = movieMuted;
  }, [movieVol, movieMuted]);

  const handleJoinCall = async () => {
    setMicError(null);
    try { await joinCall(user._id, user.username); }
    catch { setMicError("Mic access denied — check browser settings."); setTimeout(() => setMicError(null), 5000); }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room?.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = `${window.location.origin}/room/${room?.roomCode}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!isHost || !video) return;
    const state = video.paused ? "play" : "pause";
    socket.emit("toggle-play", { state, current_time: video.currentTime });
    if (state === "play") { video.play().catch(() => {}); setIsPlaying(true); }
    else                  { video.pause(); setIsPlaying(false); }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!isHost || !video) return;
    const rect   = e.currentTarget.getBoundingClientRect();
    const newTime = ((e.clientX - rect.left) / rect.width) * video.duration;
    video.currentTime = newTime;
    socket.emit("toggle-play", { state: video.paused ? "pause" : "play", current_time: newTime });
  };

  const handleTimer = (time) => {
    const video = videoRef.current;
    if (!video) return;
    const diff = video.currentTime - time;
    if (Math.abs(diff) > 2) { video.currentTime = time; }
    else if (Math.abs(diff) > 0.25) {
      video.playbackRate = diff > 0 ? 0.95 : 1.1;
      setTimeout(() => { video.playbackRate = 1; }, 1000);
    }
  };

  const handleSyncRef = useRef(null);
  handleSyncRef.current = (data) => {
    const video = videoRef.current;
    if (!video) return;
    if (data.state === "play") {
      if (video.paused) { video.muted = true; video.play().then(() => { video.muted = false; }).catch(() => {}); setIsPlaying(true); }
    } else if (data.state === "pause") {
      if (!video.paused) { video.pause(); setIsPlaying(false); }
    }
    handleTimer(data.current_time);
  };

  useEffect(() => {
    const h = (d) => handleSyncRef.current(d);
    socket.on("control", h); socket.emit("request-sync");
    return () => socket.off("control", h);
  }, []);

  useEffect(() => {
    const h = (d) => handleSyncRef.current(d);
    socket.on("get-time", h);
    return () => socket.off("get-time", h);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onTime = () => { setCurrentTime(el.currentTime); setProgress((el.currentTime / el.duration) * 100); };
    const onMeta = () => setDuration(el.duration);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    return () => { el.removeEventListener("timeupdate", onTime); el.removeEventListener("loadedmetadata", onMeta); };
  }, []);

  useEffect(() => {
    if (!isHost) return;
    const id = setInterval(() => {
      socket.emit("time-stamp", { roomId: room?.roomCode, current_time: videoRef.current?.currentTime });
    }, 2500);
    return () => clearInterval(id);
  }, [isHost, room?.roomCode]);

  const leaveRoom = () => {
    if (!window.confirm("Exit the Cinema?")) return;
    if (isInCall) leaveCall();
    socket.emit("leave-room", room?.hostId);
    socket.disconnect();
    navigate("/");
    dispatch(clearRoomState());
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center text-white overflow-hidden font-sans select-none"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onClick={() => { if (showMembers) setShowMembers(false); }}
    >

      <video
        ref={videoRef}
        src={room?.video}
        className="w-full h-full object-contain"
        playsInline
      />

      <div
        className={`absolute top-0 left-0 right-0 flex items-start justify-between gap-3 p-3 sm:p-6 bg-gradient-to-b from-black/75 to-transparent transition-all duration-400 ease-in-out ${
          showControls ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-2"
        }`}
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-base sm:text-xl font-semibold tracking-tight text-white/90 whitespace-nowrap overflow-hidden text-ellipsis max-w-[50vw]">
            {room?.videoTitle || "Cinema Room"}
          </span>
          <button
            className="inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 cursor-pointer text-inherit transition-colors hover:bg-white/10"
            onClick={copyRoomCode}
          >
            <span className="font-mono text-[11px] tracking-widest text-white/50 uppercase">{room?.roomCode}</span>
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-white/40" />}
          </button>
        </div>

        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md p-1.5 rounded-2xl border border-white/[0.07] flex-shrink-0">
          {callMembers.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-[11px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{callMembers.length + 1} in call</span>
            </div>
          )}
          <div className="flex">
            {member.slice(0, isMobile ? 2 : 4).map((m, i) => (
              <div key={i} className="-ml-1.5 first:ml-0">
                <Avatar name={m.userId.username} size={isMobile ? 30 : 34} ring />
              </div>
            ))}
            {member.length > (isMobile ? 2 : 4) && (
              <div className="w-[30px] h-[30px] -ml-1.5 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[11px] font-bold text-white/60">
                +{member.length - (isMobile ? 2 : 4)}
              </div>
            )}
          </div>
          <button
            className="p-1.5 rounded-lg cursor-pointer bg-transparent border-none text-white/65 transition-colors hover:bg-white/10 hover:text-white flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
            aria-label="Share room"
          >
            <Share2 size={isMobile ? 17 : 19} />
          </button>
          <button
            className={`p-1.5 rounded-lg cursor-pointer border-none transition-colors flex items-center justify-center ${
              showMembers ? "bg-white/95 text-black" : "bg-transparent text-white/65 hover:bg-white/10 hover:text-white"
            }`}
            onClick={(e) => { e.stopPropagation(); setShowMembers((p) => !p); }}
            aria-label="Toggle member list"
          >
            <Users size={isMobile ? 17 : 19} />
          </button>
        </div>
      </div>

      {/* MEMBER SIDEBAR */}
      <aside
        className={`absolute right-0 top-0 bottom-0 w-[min(280px,85vw)] bg-[#0a0a0e]/85 backdrop-blur-2xl border-l border-white/[0.07] transition-transform duration-300 ease-out z-50 ${
          showMembers ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full p-5 px-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3.5 flex-shrink-0">
            <span className="text-sm font-semibold text-white/85">Room</span>
            <button
              className="p-1 rounded-lg cursor-pointer bg-transparent border-none text-white/50 transition-colors hover:bg-white/10 hover:text-white flex items-center justify-center"
              onClick={() => setShowMembers(false)}
              aria-label="Close member list"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-2.5 flex-1 min-h-0">
            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[.14em] text-white/35 uppercase m-0">
              <Shield size={12} /> Audience
            </p>
            <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
              {member.map((m) => {
                const inCall = callMembers.find((c) => c.userId === m.userId._id);
                return (
                  <div key={m.userId._id} className="flex items-center gap-2.5 px-1.5 py-1 rounded-lg transition-colors hover:bg-white/[0.04]">
                    <Avatar name={m.userId.username} size={28} />
                    <span className="text-[13px] text-white/80 flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
                      {m.userId.username}
                    </span>
                    <div className="flex items-center gap-1">
                      {inCall && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" title="In call" />}
                      {m.userId._id === room?.hostId && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" title="Host" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isInCall && callMembers.length > 0 && (
            <div className="flex flex-col gap-2.5 border-t border-white/[0.07] pt-3.5 mt-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[.14em] text-white/35 uppercase m-0">
                <Volume2 size={12} /> Voice volumes
              </p>
              {callMembers.map(({ socketId, userId, username }) => {
                const vol   = volumes[socketId] ?? 1;
                const muted = vol === 0;
                const displayName = username || member.find((m) => m.userId._id === userId)?.userId?.username || "Unknown";
                return (
                  <div key={socketId} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/65 max-w-[160px] whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</span>
                      <button
                        className={`p-0.5 rounded-md cursor-pointer bg-transparent border-none transition-colors flex hover:bg-white/[0.08] hover:text-white ${
                          muted ? "text-red-400" : "text-white/40"
                        }`}
                        onClick={() => setUserVolume(socketId, muted ? 1 : 0)}
                      >
                        {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      </button>
                    </div>
                    <input
                      type="range" min={0} max={1} step={0.05} value={vol}
                      onChange={(e) => setUserVolume(socketId, parseFloat(e.target.value))}
                      className="w-full h-[3px] rounded cursor-pointer accent-indigo-400"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* MIC ERROR TOAST */}
      {micError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] px-4.5 py-2.5 rounded-xl bg-red-950/85 backdrop-blur-md border border-red-400/25 text-[13px] text-red-300 whitespace-nowrap animate-[slideDown_.3s_ease]">
          {micError}
        </div>
      )}

      {/* SHARE MODAL */}
      {showShare && (
        <div
          className="absolute inset-0 z-[300] bg-black/55 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => setShowShare(false)}
        >
          <div
            className="w-full max-w-[380px] bg-[#101016]/95 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 pt-4.5 pb-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-semibold text-white/90">Share this room</span>
              <button
                className="p-1 rounded-lg cursor-pointer bg-transparent border-none text-white/50 transition-colors hover:bg-white/10 hover:text-white flex items-center justify-center"
                onClick={() => setShowShare(false)}
                aria-label="Close share popup"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4.5">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-[10px] bg-white/5 border border-white/10 text-white/70 text-xs font-mono outline-none focus:border-indigo-300/40"
                onFocus={(e) => e.target.select()}
              />
              <button
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-[10px] border-none bg-indigo-500/[0.18] text-indigo-300 text-xs font-bold tracking-wide cursor-pointer whitespace-nowrap transition-colors hover:bg-indigo-500/30"
                onClick={copyShareLink}
              >
                {shareCopied ? <Check size={15} /> : <Copy size={15} />}
                {shareCopied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className="text-[10px] font-bold tracking-[.14em] text-white/35 uppercase mb-2.5">Share to</p>
            <div className="grid grid-cols-3 gap-2">
              <button className="flex flex-col items-center gap-1.5 py-3 px-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 cursor-not-allowed text-[10px] font-semibold" disabled title="Coming soon">
                <Instagram size={18} />
                <span>Instagram</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 py-3 px-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 cursor-not-allowed text-[10px] font-semibold" disabled title="Coming soon">
                <Youtube size={18} />
                <span>YouTube</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 py-3 px-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 cursor-not-allowed text-[10px] font-semibold" disabled title="Coming soon">
                <Send size={18} />
                <span>Telegram</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY — purely visual, no click-to-toggle */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center animate-[popIn_.2s_cubic-bezier(.34,1.56,.64,1)]">
            <Play size={isMobile ? 28 : 38} fill="white" />
          </div>
        </div>
      )}

      {/* BOTTOM CONTROLS */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-2 sm:px-7 py-2 sm:py-5 bg-gradient-to-t from-black/85 to-transparent transition-all duration-400 ease-in-out ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-[960px] mx-auto bg-[#0c0c12]/75 backdrop-blur-3xl border border-white/[0.07] rounded-2xl sm:rounded-3xl px-3 sm:px-5.5 py-2.5 sm:py-4 flex flex-col gap-2">

          {/* Progress bar */}
          <div
            className="group relative h-[3px] hover:h-[5px] w-full bg-white/15 rounded-full transition-all"
            onClick={isHost ? handleSeek : undefined}
            style={{ cursor: isHost ? "pointer" : "default" }}
          >
            <div className="h-full bg-red-600 rounded-full relative transition-[width] duration-75 ease-linear" style={{ width: `${progress}%` }}>
              {isHost && (
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(224,49,49,0.5)] opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-white/45">
            <span className="text-white/85 font-semibold">{fmt(currentTime)}</span>
            <span className="text-white/20">/</span>
            <span>{fmt(duration)}</span>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">

            {/* Left: playback */}
            <div className="flex items-center gap-1 sm:gap-2.5">
              {isHost && (
                <>
                  <button
                    className="p-1.5 sm:p-2 rounded-lg bg-transparent border-none text-white/60 cursor-pointer transition-colors hover:bg-white/[0.09] hover:text-white flex items-center justify-center"
                    aria-label="Rewind 10s"
                    onClick={() => {
                      videoRef.current.currentTime -= 10;
                      socket.emit("toggle-play", { state: videoRef.current.paused ? "pause" : "play", current_time: videoRef.current.currentTime });
                    }}
                  >
                    <Rewind size={isMobile ? 17 : 19} />
                  </button>
                  <button
                    className="w-[38px] h-[38px] sm:w-12 sm:h-12 rounded-full border-none cursor-pointer bg-white text-black flex items-center justify-center flex-shrink-0 transition-transform hover:scale-[1.08] hover:shadow-[0_0_0_6px_rgba(255,255,255,0.08)]"
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={isMobile ? 19 : 22} fill="black" /> : <Play size={isMobile ? 19 : 22} fill="black" className="ml-0.5" />}
                  </button>
                  <button
                    className="p-1.5 sm:p-2 rounded-lg bg-transparent border-none text-white/60 cursor-pointer transition-colors hover:bg-white/[0.09] hover:text-white flex items-center justify-center"
                    aria-label="Forward 10s"
                    onClick={() => {
                      videoRef.current.currentTime += 10;
                      socket.emit("toggle-play", { state: videoRef.current.paused ? "pause" : "play", current_time: videoRef.current.currentTime });
                    }}
                  >
                    <FastForward size={isMobile ? 17 : 19} />
                  </button>
                </>
              )}

              {/* Movie volume control */}
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 sm:p-2 rounded-lg bg-transparent border-none text-white/60 cursor-pointer transition-colors hover:bg-white/[0.09] hover:text-white flex items-center justify-center"
                  aria-label="Toggle movie audio"
                  onClick={() => setMovieMuted((p) => !p)}
                >
                  <VolIcon v={movieMuted ? 0 : movieVol} size={isMobile ? 16 : 18} />
                </button>
                {!isMobile && (
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={movieMuted ? 0 : movieVol}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setMovieVol(v);
                      if (v > 0) setMovieMuted(false);
                    }}
                    className="w-[50px] sm:w-20 h-[3px] cursor-pointer accent-white/70"
                    aria-label="Movie volume"
                  />
                )}
              </div>
            </div>

            {/* Right: voice + util */}
            <div className="flex items-center gap-1 sm:gap-2.5">

              {isInCall && (
                <button
                  className={`p-1.5 sm:p-2 rounded-lg border border-white/[0.08] cursor-pointer transition-colors flex items-center justify-center ${
                    isMuted ? "text-red-400 hover:bg-red-400/[0.12]" : "text-white/60 hover:bg-white/[0.09] hover:text-white"
                  }`}
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute mic" : "Mute mic"}
                >
                  {isMuted ? <MicOff size={isMobile ? 16 : 18} /> : <Mic size={isMobile ? 16 : 18} />}
                </button>
              )}

              <button
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg border cursor-pointer text-[11px] sm:text-[13px] font-bold tracking-wide uppercase whitespace-nowrap transition-colors ${
                  isInCall
                    ? "bg-emerald-400/[0.12] border-emerald-400/25 text-emerald-400 hover:bg-red-400/[0.15] hover:border-red-400/25 hover:text-red-400"
                    : "bg-indigo-500/[0.15] border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/25"
                }`}
                onClick={isInCall ? leaveCall : handleJoinCall}
                aria-label={isInCall ? "Leave voice call" : "Join voice call"}
              >
                {isInCall
                  ? <><PhoneOff size={14} />{!isMobile && " Leave"}</>
                  : <><PhoneCall size={14} />{!isMobile && " Join call"}</>
                }
              </button>

              <div className="w-px h-5.5 bg-white/[0.08] flex-shrink-0" />

              <button
                className="p-1.5 sm:p-2 rounded-lg bg-transparent border-none text-white/60 cursor-pointer transition-colors hover:bg-white/[0.09] hover:text-white flex items-center justify-center"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
                title={isFullscreen ? "Exit fullscreen [F]" : "Fullscreen [F]"}
              >
                {isFullscreen ? <Minimize size={isMobile ? 16 : 18} /> : <Maximize size={isMobile ? 16 : 18} />}
              </button>

              <div className="w-px h-5.5 bg-white/[0.08] flex-shrink-0" />

              <button
                className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-red-600/20 bg-red-600/[0.08] text-red-400 cursor-pointer text-[11px] sm:text-[13px] font-bold tracking-wide uppercase whitespace-nowrap transition-colors hover:bg-red-600/70 hover:text-white hover:border-transparent"
                onClick={leaveRoom}
                aria-label="Leave room"
              >
                <LogOut size={isMobile ? 15 : 17} />
                {!isMobile && " Exit"}
              </button>
            </div>
          </div>

          {/* Keyboard hints (desktop only) */}
          {!isMobile && (
            <div className="flex items-center gap-3.5 pt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] text-white/20">
                <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-white/[0.07] border border-white/[0.12] font-mono text-[9px] text-white/35">Space</kbd> play/pause
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/20">
                <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-white/[0.07] border border-white/[0.12] font-mono text-[9px] text-white/35">F</kbd> fullscreen
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/20">
                <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-white/[0.07] border border-white/[0.12] font-mono text-[9px] text-white/35">M</kbd> mute movie
              </span>
              {isHost && (
                <span className="flex items-center gap-1 text-[10px] text-white/20">
                  <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-white/[0.07] border border-white/[0.12] font-mono text-[9px] text-white/35">←</kbd>
                  <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-white/[0.07] border border-white/[0.12] font-mono text-[9px] text-white/35">→</kbd> seek
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Theater;