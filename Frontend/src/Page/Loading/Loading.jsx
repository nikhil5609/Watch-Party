import React from 'react';

const Loading = () => {
  return (
    <div className="min-h-screen bg-[#07070f] text-[#f0eef8] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Radial Glows matching Landing & Login theme */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[500px] bg-radial-gradient from-[#c8102e]/12 to-transparent pointer-events-none blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-radial-gradient from-[#501eb4]/05 to-transparent pointer-events-none blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full mx-auto">
        
        {/* Animated Logo Container with New Brand Identity */}
        <div className="relative mb-10 flex flex-col items-center">
          
          {/* Outer elegant spinning neon aura */}
          <div className="w-24 h-24 rounded-2xl border border-white/[0.04] border-t-[#c8102e] animate-spin [animation-duration:1.2s]"></div>
          
          {/* Center Logo Icon from recent designs */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#c8102e] to-[#ef4444] rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(200,16,46,0.5)] animate-bounce">
              <span className="text-white text-2xl font-black italic tracking-tighter select-none">C</span>
            </div>
          </div>
        </div>

        {/* Brand Text Info */}
        <div className="text-center space-y-4 w-full px-4">
          <h2 className="text-lg sm:text-xl font-black text-white tracking-widest uppercase">
            CINE<span className="bg-gradient-to-r from-[#c8102e] to-[#ef4444] bg-clip-text text-transparent">SYNC</span>
          </h2>
          
          <p className="text-sm font-semibold text-white/90 tracking-wide">
            Preparing the Show
          </p>
          
          {/* High-fidelity Cinematic Loading Bar */}
          <div className="w-40 sm:w-48 h-[3px] bg-white/[0.06] rounded-full mx-auto overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-[#c8102e] to-[#ef4444] rounded-full absolute left-0 top-0 w-1/2"
              style={{
                animation: 'loadingBar 1.5s infinite ease-in-out'
              }}
            ></div>
          </div>
          
          <p className="text-[#8885a0] text-xs font-medium animate-pulse">
            Syncing projectors...
          </p>
        </div>
      </div>

      {/* Styled Film Strip Decoration (Responsive & Loop Simulated) */}
      <div className="absolute bottom-8 left-0 w-full flex gap-3 opacity-[0.02] overflow-hidden whitespace-nowrap select-none pointer-events-none px-4 justify-center">
         {[...Array(8)].map((_, i) => (
           <div 
             key={i} 
             className="w-16 h-12 sm:w-20 sm:h-14 border border-white rounded-lg flex-shrink-0 relative before:content-[''] before:absolute before:inset-x-0 before:top-1 before:h-1 before:border-b before:border-dashed before:border-white/40 after:content-[''] after:absolute after:inset-x-0 after:bottom-1 after:h-1 after:border-t after:border-dashed after:border-white/40"
           ></div>
         ))}
      </div>

      {/* Embedded keyframe for the loading progress tracking wrapper */}
      <style>{`
        @keyframes loadingBar {
          0% { left: -50%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Loading;