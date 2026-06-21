import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Home, ArrowLeft, Tv2 } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden select-none font-sans px-4">
      
      {/* Cinematic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content Card */}
      <div className="text-center max-w-md z-10 space-y-8">
        
        {/* Animated Icon Composition */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl scale-75 animate-pulse" />
          <div className="relative bg-slate-900/50 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
            <Film size={64} className="text-indigo-400 animate-[spin_8s_linear_infinite]" />
            <div className="absolute -top-1 -right-1 bg-red-500 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-lg border border-red-400/20">
              Cut!
            </div>
          </div>
        </div>

        {/* Text Headers */}
        <div className="space-y-3">
          <h1 className="text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
            404
          </h1>
          <h2 className="text-xl font-bold tracking-tight text-slate-200">
            This screening has been cancelled
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            Looks like you wandered away from the lobby. The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-sm font-medium active:scale-95 text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all text-sm font-bold uppercase tracking-wider active:scale-95"
          >
            <Home size={16} /> Home Lobby
          </button>
        </div>

      </div>

      {/* Footer Branding Decorator */}
      <div className="absolute bottom-8 flex items-center gap-2 text-slate-600 text-xs tracking-widest uppercase font-mono">
        <Tv2 size={14} /> Watch Party Cinema Engine
      </div>
    </div>
  );
};

export default NotFound;