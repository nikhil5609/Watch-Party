import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Play, Pause, Maximize, Minimize,
  LogOut, Shield, Rewind, FastForward, Copy, Check, Users,
  Mic, MicOff, PhoneCall, PhoneOff, Volume2, VolumeX, Volume1,
} from "lucide-react";
import { socket } from "../../socket";
import { clearRoomState } from "../../Store/room.slice";

// ── tiny helpers ────────────────────────────────────────────────────────────
const fmt = (t) => {
  if (isNaN(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const Avatar = ({ name = "?", size = 36, ring = false }) => (
  <div
    style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: "#fff",
      border: ring ? "2px solid #000" : "none",
      flexShrink: 0,
    }}
  >
    {name.charAt(0).toUpperCase()}
  </div>
);

// ── volume icon picker ───────────────────────────────────────────────────────
const VolIcon = ({ v, size = 18 }) => {
  if (v === 0) return <VolumeX size={size} />;
  if (v < 0.5) return <Volume1 size={size} />;
  return <Volume2 size={size} />;
};

// ── main component ───────────────────────────────────────────────────────────
const Theater = ({ member = [], webrtc }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { room } = useSelector((s) => s.room);
  const { user }  = useSelector((s) => s.user);

  // ui state
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

  const videoRef      = useRef(null);
  const containerRef  = useRef(null);
  const duckFrameRef  = useRef(null);
  const hideTimerRef  = useRef(null);
  const isHost = user?._id === room?.hostId;

  const {
    isInCall, isMuted, callMembers, volumes, isSomeoneSpeaking,
    joinCall, leaveCall, toggleMute, setUserVolume,
  } = webrtc;

  // ── mobile detect ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── auto-hide controls ─────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => clearTimeout(hideTimerRef.current);
  }, []);

  // ── keyboard shortcuts ─────────────────────────────────────────────────────
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

  // ── fullscreen change listener ─────────────────────────────────────────────
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // ── audio ducking ──────────────────────────────────────────────────────────
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

  // ── apply movie volume to video element ───────────────────────────────────
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = movieMuted ? 0 : movieVol;
    videoRef.current.muted  = movieMuted;
  }, [movieVol, movieMuted]);

  // ── call handlers ──────────────────────────────────────────────────────────
  const handleJoinCall = async () => {
    setMicError(null);
    try { await joinCall(user._id, user.username); }
    catch { setMicError("Mic access denied — check browser settings."); setTimeout(() => setMicError(null), 5000); }
  };

  // ── video helpers ──────────────────────────────────────────────────────────
  const copyRoomCode = () => {
    navigator.clipboard.writeText(room?.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="theater-root"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onClick={() => { if (showMembers) setShowMembers(false); }}
    >

      {/* VIDEO */}
      <video
        ref={videoRef}
        src={room?.video}
        className="theater-video"
        onClick={togglePlay}
        playsInline
      />

      {/* TOP BAR */}
      <div className={`theater-top ${showControls ? "vis" : "hid"}`}>
        <div className="top-left">
          <span className="movie-title">{room?.videoTitle || "Cinema Room"}</span>
          <button className="room-code-btn" onClick={copyRoomCode}>
            <span className="mono">{room?.roomCode}</span>
            {copied ? <Check size={13} className="icon-success" /> : <Copy size={13} className="icon-muted" />}
          </button>
        </div>

        <div className="top-right">
          {callMembers.length > 0 && (
            <div className="call-pill">
              <span className="call-dot" />
              <span>{callMembers.length + 1} in call</span>
            </div>
          )}
          <div className="avatar-stack">
            {member.slice(0, isMobile ? 2 : 4).map((m, i) => (
              <Avatar key={i} name={m.userId.username} size={isMobile ? 30 : 34} ring />
            ))}
            {member.length > (isMobile ? 2 : 4) && (
              <div className="avatar-more">+{member.length - (isMobile ? 2 : 4)}</div>
            )}
          </div>
          <button
            className={`icon-btn ${showMembers ? "active" : ""}`}
            onClick={(e) => { e.stopPropagation(); setShowMembers((p) => !p); }}
            aria-label="Toggle member list"
          >
            <Users size={isMobile ? 17 : 19} />
          </button>
        </div>
      </div>

      {/* MEMBER SIDEBAR */}
      <aside className={`sidebar ${showMembers ? "sidebar-open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-inner">
          <div className="sidebar-section" style={{ flex: 1, minHeight: 0 }}>
            <p className="sidebar-label"><Shield size={12} /> Audience</p>
            <div className="member-list">
              {member.map((m) => {
                const inCall = callMembers.find((c) => c.userId === m.userId._id);
                return (
                  <div key={m.userId._id} className="member-row">
                    <Avatar name={m.userId.username} size={28} />
                    <span className="member-name">{m.userId.username}</span>
                    <div className="member-badges">
                      {inCall && <span className="badge-call" title="In call" />}
                      {m.userId._id === room?.hostId && <span className="badge-host" title="Host" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isInCall && callMembers.length > 0 && (
            <div className="sidebar-section vol-section">
              <p className="sidebar-label"><Volume2 size={12} /> Voice volumes</p>
              {callMembers.map(({ socketId, userId, username }) => {
                const vol   = volumes[socketId] ?? 1;
                const muted = vol === 0;
                const displayName = username || member.find((m) => m.userId._id === userId)?.userId?.username || "Unknown";
                return (
                  <div key={socketId} className="vol-row">
                    <div className="vol-header">
                      <span className="vol-name">{displayName}</span>
                      <button
                        className={`vol-mute-btn ${muted ? "muted" : ""}`}
                        onClick={() => setUserVolume(socketId, muted ? 1 : 0)}
                      >
                        {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      </button>
                    </div>
                    <input
                      type="range" min={0} max={1} step={0.05} value={vol}
                      onChange={(e) => setUserVolume(socketId, parseFloat(e.target.value))}
                      className="vol-slider"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* MIC ERROR TOAST */}
      {micError && <div className="mic-toast">{micError}</div>}

      {/* PAUSE OVERLAY */}
      {!isPlaying && (
        <div className="pause-overlay" onClick={togglePlay}>
          <div className="pause-icon-wrap">
            <Play size={isMobile ? 28 : 38} fill="white" />
          </div>
        </div>
      )}

      {/* BOTTOM CONTROLS */}
      <div className={`theater-bottom ${showControls ? "vis" : "hid"}`}>
        <div className="controls-card">

          {/* Progress bar */}
          <div className="progress-track" onClick={isHost ? handleSeek : undefined} style={{ cursor: isHost ? "pointer" : "default" }}>
            <div className="progress-fill" style={{ width: `${progress}%` }}>
              {isHost && <div className="progress-thumb" />}
            </div>
          </div>

          {/* Time */}
          <div className="time-row">
            <span className="time-current">{fmt(currentTime)}</span>
            <span className="time-sep">/</span>
            <span className="time-total">{fmt(duration)}</span>
          </div>

          {/* Controls row */}
          <div className="controls-row">

            {/* Left: playback */}
            <div className="controls-left">
              {isHost && (
                <>
                  <button
                    className="ctrl-btn"
                    aria-label="Rewind 10s"
                    onClick={() => {
                      videoRef.current.currentTime -= 10;
                      socket.emit("toggle-play", { state: videoRef.current.paused ? "pause" : "play", current_time: videoRef.current.currentTime });
                    }}
                  >
                    <Rewind size={isMobile ? 17 : 19} />
                  </button>
                  <button className="play-btn" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? <Pause size={isMobile ? 19 : 22} fill="black" /> : <Play size={isMobile ? 19 : 22} fill="black" className="play-offset" />}
                  </button>
                  <button
                    className="ctrl-btn"
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
              <div className="movie-vol-group">
                <button
                  className="ctrl-btn"
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
                    className="movie-vol-slider"
                    aria-label="Movie volume"
                  />
                )}
              </div>
            </div>

            {/* Right: voice + util */}
            <div className="controls-right">

              {isInCall && (
                <button
                  className={`ctrl-btn mic-btn ${isMuted ? "danger" : ""}`}
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute mic" : "Mute mic"}
                >
                  {isMuted ? <MicOff size={isMobile ? 16 : 18} /> : <Mic size={isMobile ? 16 : 18} />}
                </button>
              )}

              <button
                className={`call-btn ${isInCall ? "in-call" : "join-call"}`}
                onClick={isInCall ? leaveCall : handleJoinCall}
                aria-label={isInCall ? "Leave voice call" : "Join voice call"}
              >
                {isInCall
                  ? <><PhoneOff size={14} />{!isMobile && " Leave"}</>
                  : <><PhoneCall size={14} />{!isMobile && " Join call"}</>
                }
              </button>

              <div className="divider-v" />

              <button
                className="ctrl-btn"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
                title={isFullscreen ? "Exit fullscreen [F]" : "Fullscreen [F]"}
              >
                {isFullscreen ? <Minimize size={isMobile ? 16 : 18} /> : <Maximize size={isMobile ? 16 : 18} />}
              </button>

              <div className="divider-v" />

              <button className="leave-btn" onClick={leaveRoom} aria-label="Leave room">
                <LogOut size={isMobile ? 15 : 17} />
                {!isMobile && " Exit"}
              </button>
            </div>
          </div>

          {!isMobile && (
            <div className="kbd-hints">
              <span><kbd>Space</kbd> play/pause</span>
              <span><kbd>F</kbd> fullscreen</span>
              <span><kbd>M</kbd> mute movie</span>
              {isHost && <span><kbd>←</kbd><kbd>→</kbd> seek</span>}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .theater-root {
          position: fixed; inset: 0;
          background: #000;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
          user-select: none;
          -webkit-user-select: none;
        }

        .theater-video {
          width: 100%; height: 100%;
          object-fit: contain;
          cursor: pointer;
        }

        /* ── top bar ── */
        .theater-top {
          position: absolute; top: 0; left: 0; right: 0;
          padding: clamp(12px, 3vw, 24px);
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 12px;
          background: linear-gradient(to bottom, rgba(0,0,0,.75) 0%, transparent 100%);
          transition: opacity .4s ease, transform .4s ease;
        }
        .vis { opacity: 1; pointer-events: auto; transform: translateY(0); }
        .hid { opacity: 0; pointer-events: none; }
        .theater-top.hid { transform: translateY(-8px); }
        .theater-bottom.hid { transform: translateY(8px); }

        .top-left {
          display: flex; flex-direction: column; gap: 6px;
          min-width: 0;
        }
        .movie-title {
          font-size: clamp(15px, 2.5vw, 22px);
          font-weight: 600; letter-spacing: -.02em;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 50vw;
          color: rgba(255,255,255,.92);
        }
        .room-code-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 20px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.12);
          cursor: pointer; color: inherit;
          transition: background .15s;
          width: fit-content;
        }
        .room-code-btn:hover { background: rgba(255,255,255,.12); }
        .mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; letter-spacing: .12em; color: rgba(255,255,255,.5); text-transform: uppercase; }
        .icon-success { color: #34d399; }
        .icon-muted   { color: rgba(255,255,255,.4); }

        .top-right {
          display: flex; align-items: center; gap: 8px;
          background: rgba(0,0,0,.3);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          padding: 6px 8px; border-radius: 16px;
          border: 1px solid rgba(255,255,255,.07);
          flex-shrink: 0;
        }
        .call-pill {
          display: flex; align-items: center; gap: 5px;
          padding: 3px 8px; border-radius: 20px;
          background: rgba(52,211,153,.12); border: 1px solid rgba(52,211,153,.2);
          font-size: 11px; color: #34d399; font-weight: 600;
        }
        .call-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #34d399; animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        .avatar-stack { display: flex; }
        .avatar-more {
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(255,255,255,.1); border: 2px solid #000;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,.6);
          margin-left: -6px;
        }

        .icon-btn {
          padding: 6px; border-radius: 10px; cursor: pointer;
          background: transparent; border: none; color: rgba(255,255,255,.65);
          transition: background .15s, color .15s;
          display: flex; align-items: center; justify-content: center;
        }
        .icon-btn:hover { background: rgba(255,255,255,.1); color: #fff; }
        .icon-btn.active { background: rgba(255,255,255,.95); color: #000; }

        /* ── sidebar ── */
        .sidebar {
          position: absolute; right: 0; top: 0; bottom: 0;
          width: min(280px, 85vw);
          background: rgba(10,10,14,.85);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-left: 1px solid rgba(255,255,255,.07);
          transition: transform .35s cubic-bezier(.4,0,.2,1);
          transform: translateX(100%);
          z-index: 50;
        }
        .sidebar-open { transform: translateX(0); }

        .sidebar-inner {
          display: flex; flex-direction: column; gap: 0;
          height: 100%; padding: 20px 16px;
          overflow: hidden;
        }
        .sidebar-section { display: flex; flex-direction: column; gap: 10px; }
        .vol-section {
          border-top: 1px solid rgba(255,255,255,.07);
          padding-top: 14px; margin-top: 14px;
        }
        .sidebar-label {
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; font-weight: 700; letter-spacing: .14em;
          color: rgba(255,255,255,.35); text-transform: uppercase;
          margin: 0;
        }
        .member-list { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; flex: 1; }
        .member-list::-webkit-scrollbar { width: 3px; }
        .member-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }
        .member-row {
          display: flex; align-items: center; gap: 9px;
          padding: 5px 6px; border-radius: 8px;
          transition: background .12s;
        }
        .member-row:hover { background: rgba(255,255,255,.04); }
        .member-name { font-size: 13px; color: rgba(255,255,255,.8); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .member-badges { display: flex; align-items: center; gap: 4px; }
        .badge-call {
          width: 6px; height: 6px; border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 6px rgba(52,211,153,.6);
        }
        .badge-host {
          width: 6px; height: 6px; border-radius: 50%;
          background: #fbbf24;
          box-shadow: 0 0 6px rgba(251,191,36,.5);
        }

        /* volume rows */
        .vol-row { display: flex; flex-direction: column; gap: 5px; }
        .vol-header { display: flex; align-items: center; justify-content: space-between; }
        .vol-name { font-size: 12px; color: rgba(255,255,255,.65); max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .vol-mute-btn {
          padding: 3px; border-radius: 6px; cursor: pointer;
          background: transparent; border: none; color: rgba(255,255,255,.4);
          transition: background .12s, color .12s; display: flex;
        }
        .vol-mute-btn.muted { color: #f87171; }
        .vol-mute-btn:hover { background: rgba(255,255,255,.08); color: #fff; }
        .vol-slider {
          width: 100%; height: 3px;
          accent-color: #818cf8;
          cursor: pointer; border-radius: 4px;
        }

        /* ── mic toast ── */
        .mic-toast {
          position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
          z-index: 200;
          padding: 10px 18px; border-radius: 12px;
          background: rgba(127,29,29,.85);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(248,113,113,.25);
          font-size: 13px; color: #fca5a5;
          white-space: nowrap;
          animation: slideDown .3s ease;
        }
        @keyframes slideDown { from{transform:translateX(-50%) translateY(-8px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }

        /* ── pause overlay ── */
        .pause-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          pointer-events: auto; cursor: pointer;
        }
        .pause-icon-wrap {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(0,0,0,.55);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.15);
          display: flex; align-items: center; justify-content: center;
          animation: popIn .2s cubic-bezier(.34,1.56,.64,1);
          pointer-events: none;
        }
        @keyframes popIn { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }

        /* ── bottom controls ── */
        .theater-bottom {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: clamp(8px, 2vw, 20px) clamp(8px, 3vw, 28px);
          background: linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 100%);
          transition: opacity .4s ease, transform .4s ease;
        }

        .controls-card {
          width: 100%; max-width: 960px; margin: 0 auto;
          background: rgba(12,12,18,.75);
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: clamp(14px, 2vw, 24px);
          padding: clamp(10px, 2vw, 16px) clamp(12px, 2.5vw, 22px);
          display: flex; flex-direction: column; gap: 8px;
        }

        /* progress */
        .progress-track {
          position: relative; height: 3px; width: 100%;
          background: rgba(255,255,255,.15);
          border-radius: 999px; overflow: visible;
          transition: height .15s;
        }
        .progress-track:hover { height: 5px; }
        .progress-fill {
          height: 100%; background: #e03131;
          border-radius: 999px; position: relative;
          transition: width .075s linear;
        }
        .progress-thumb {
          position: absolute; right: -5px; top: 50%; transform: translateY(-50%);
          width: 12px; height: 12px; border-radius: 50%;
          background: #fff; box-shadow: 0 0 8px rgba(224,49,49,.5);
          opacity: 0; transition: opacity .15s;
        }
        .progress-track:hover .progress-thumb { opacity: 1; }

        .time-row {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; font-family: 'SF Mono','Fira Code',monospace;
          color: rgba(255,255,255,.45);
        }
        .time-current { color: rgba(255,255,255,.85); font-weight: 600; }
        .time-sep { color: rgba(255,255,255,.2); }
        .time-total {}

        .controls-row {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          flex-wrap: wrap;
        }
        .controls-left, .controls-right {
          display: flex; align-items: center; gap: clamp(4px, 1vw, 10px);
        }

        .ctrl-btn {
          padding: clamp(6px, 1vw, 9px); border-radius: 10px;
          background: transparent; border: none; color: rgba(255,255,255,.6);
          cursor: pointer; transition: background .12s, color .12s;
          display: flex; align-items: center; justify-content: center;
        }
        .ctrl-btn:hover { background: rgba(255,255,255,.09); color: #fff; }
        .ctrl-btn.danger { color: #f87171; }
        .ctrl-btn.danger:hover { background: rgba(248,113,113,.12); }
        .ctrl-btn.mic-btn { border: 1px solid rgba(255,255,255,.08); border-radius: 10px; }

        .play-btn {
          width: clamp(38px, 5vw, 48px); height: clamp(38px, 5vw, 48px);
          border-radius: 50%; border: none; cursor: pointer;
          background: #fff; color: #000;
          display: flex; align-items: center; justify-content: center;
          transition: transform .12s, box-shadow .12s;
          flex-shrink: 0;
        }
        .play-btn:hover { transform: scale(1.08); box-shadow: 0 0 0 6px rgba(255,255,255,.08); }
        .play-offset { margin-left: 2px; }

        /* movie volume */
        .movie-vol-group { display: flex; align-items: center; gap: 4px; }
        .movie-vol-slider {
          width: clamp(50px, 7vw, 80px); height: 3px;
          accent-color: rgba(255,255,255,.7);
          cursor: pointer;
        }

        /* call button */
        .call-btn {
          display: flex; align-items: center; gap: 5px;
          padding: clamp(6px, 1vw, 8px) clamp(10px, 1.5vw, 14px);
          border-radius: 10px; border: none; cursor: pointer;
          font-size: clamp(11px, 1.2vw, 13px); font-weight: 700;
          letter-spacing: .05em; text-transform: uppercase;
          transition: background .15s, color .15s;
          white-space: nowrap;
        }
        .join-call {
          background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.25);
          color: #a5b4fc;
        }
        .join-call:hover { background: rgba(99,102,241,.25); }
        .in-call {
          background: rgba(52,211,153,.12); border: 1px solid rgba(52,211,153,.25);
          color: #34d399;
        }
        .in-call:hover { background: rgba(248,113,113,.15); border-color: rgba(248,113,113,.25); color: #f87171; }

        .leave-btn {
          display: flex; align-items: center; gap: 5px;
          padding: clamp(6px, 1vw, 8px) clamp(10px, 1.5vw, 16px);
          border-radius: 10px; border: 1px solid rgba(224,49,49,.2);
          background: rgba(224,49,49,.08); color: #f87171;
          cursor: pointer; font-size: clamp(11px, 1.2vw, 13px); font-weight: 700;
          letter-spacing: .05em; text-transform: uppercase;
          transition: background .15s, color .15s;
          white-space: nowrap;
        }
        .leave-btn:hover { background: rgba(224,49,49,.7); color: #fff; border-color: transparent; }

        .divider-v {
          width: 1px; height: 22px;
          background: rgba(255,255,255,.08); flex-shrink: 0;
        }

        /* keyboard hints */
        .kbd-hints {
          display: flex; align-items: center; gap: 14px;
          padding-top: 2px;
          flex-wrap: wrap;
        }
        .kbd-hints span {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; color: rgba(255,255,255,.22);
        }
        kbd {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 1px 5px; border-radius: 4px;
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12);
          font-family: 'SF Mono','Fira Code',monospace;
          font-size: 9px; color: rgba(255,255,255,.35);
        }

        /* mobile adjustments */
        @media (max-width: 639px) {
          .controls-left, .controls-right { gap: 4px; }
          .controls-card { padding: 10px 12px; gap: 6px; }
          .sidebar { width: 88vw; }
        }
      `}</style>
    </div>
  );
};

export default Theater;