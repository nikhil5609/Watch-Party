import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { 
  Mic, MicOff, Volume2, VolumeX, Maximize, 
  Play, Pause, SkipForward, Settings, Users, 
  MessageSquare, ChevronLeft, 
  Film
} from "lucide-react";

const Theater = () => {
  const { room } = useSelector((state) => state.room);
  const { user } = useSelector((state) => state.user);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [speakerActive, setSpeakerActive] = useState(true);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const isHost = user?._id === room?.hostId;

  // Fullscreen Logic (F key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'f') {
        if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Control visibility timer
  useEffect(() => {
    let timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="h-screen w-screen bg-[#020617] overflow-hidden flex text-white font-sans">
      
      {/* LEFT: MEMBER SOCIAL BAR */}
      <aside className="w-20 lg:w-24 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-6 gap-6 z-20">
        <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-600/20 mb-4">
          <Film size={24} />
        </div>
        
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          {room?.members?.map((member) => (
            <div key={member.userId._id} className="relative group flex flex-col items-center">
              <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center bg-slate-800 transition-all duration-300 ${member.userId._id === user._id ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-white/10'}`}>
                <span className="text-xs font-bold uppercase">{member.userId.username.slice(0, 2)}</span>
                
                {/* Audio Status Indicators */}
                <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                  <div className={`p-1 rounded-md ${micActive ? 'bg-green-500' : 'bg-red-500'} border border-black`}>
                    {micActive ? <Mic size={8} /> : <MicOff size={8} />}
                  </div>
                </div>
              </div>
              
              {/* Member Controls Popover */}
              <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 p-2 rounded-xl flex gap-2 shadow-2xl z-30 pointer-events-none group-hover:pointer-events-auto">
                <button 
                  onClick={() => setMicActive(!micActive)}
                  className={`p-2 rounded-lg transition-colors ${micActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                >
                  {micActive ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
                <button 
                  onClick={() => setSpeakerActive(!speakerActive)}
                  className={`p-2 rounded-lg transition-colors ${speakerActive ? 'bg-blue-500/20 text-blue-500' : 'bg-slate-700 text-slate-400'}`}
                >
                  {speakerActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN: THE CINEMA STAGE */}
      <main className="relative flex-1 flex flex-col items-center justify-center bg-black">
        
        {/* Ambient Backdrop Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[60%] bg-red-600/10 blur-[160px] opacity-50 rounded-full" />
        </div>

        {/* Video Container */}
        <div className="relative w-full max-w-[90vw] aspect-video group shadow-[0_0_100px_rgba(0,0,0,0.5)] z-10">
          <video 
            ref={videoRef}
            src={room?.video || ""} // Assuming the local URL is passed here
            className="w-full h-full object-contain rounded-sm"
            onClick={() => isHost && setIsPlaying(!isPlaying)}
          />

          {/* OVERLAY CONTROLS (Only visible if Host) */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 transition-opacity duration-500 flex flex-col justify-between p-6 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            
            {/* Top Bar */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft /></button>
                <div>
                  <h1 className="text-sm font-bold tracking-widest uppercase text-white/90">{room?.video?.name || "Now Playing"}</h1>
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Live Session • {room?.roomCode}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"><Settings size={20}/></button>
              </div>
            </div>

            {/* Bottom Host Controls */}
            {isHost && (
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="group/progress relative h-1.5 w-full bg-white/10 rounded-full cursor-pointer overflow-hidden">
                  <div className="absolute h-full w-1/3 bg-red-600 rounded-full" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform">
                      {isPlaying ? <Pause fill="black" /> : <Play fill="black" />}
                    </button>
                    <button className="text-white/70 hover:text-white"><SkipForward /></button>
                    <div className="flex items-center gap-3 text-xs font-mono text-white/60">
                      <span>12:45</span> / <span>02:15:00</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                       <button className="p-2 hover:bg-white/10 rounded-lg"><Volume2 size={18}/></button>
                       <input type="range" className="w-20 accent-red-600" />
                    </div>
                    <button onClick={() => containerRef.current.requestFullscreen()} className="p-3 bg-red-600/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">
                      <Maximize size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* RIGHT: CHAT / INFO (Hidden on mobile) */}
      <aside className="hidden xl:flex w-80 bg-slate-900/40 backdrop-blur-2xl border-l border-white/5 flex-col p-6 z-20">
        <div className="flex items-center gap-2 mb-8">
           <MessageSquare size={18} className="text-red-500" />
           <h2 className="text-xs font-black tracking-widest uppercase">Live Chat</h2>
        </div>
        <div className="flex-1 flex flex-col justify-end gap-4">
          <p className="text-[11px] text-slate-500 text-center italic">Welcome to the theater. Chat is synced for all members.</p>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-red-500/50 transition-all"
            />
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Theater;