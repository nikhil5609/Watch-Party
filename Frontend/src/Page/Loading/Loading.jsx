import React from 'react';

const Loading = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] animate-pulse"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo Container */}
        <div className="relative mb-8">
          {/* Outer rotating ring */}
          <div className="w-24 h-24 rounded-3xl border-2 border-red-600/20 border-t-red-600 animate-spin transition-all"></div>
          
          {/* Center Logo Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-bounce">
              <span className="text-white text-2xl font-black">C</span>
            </div>
          </div>
        </div>

        {/* Text Information */}
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">
            Preparing the <span className="text-red-600">Show</span>
          </h2>
          
          {/* Animated Loading Bar */}
          <div className="w-48 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-red-600 w-1/3 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
          </div>
          
          <p className="text-slate-500 text-sm font-medium animate-pulse">
            Syncing projectors...
          </p>
        </div>
      </div>

      {/* Film Strip Decoration (Optional) */}
      <div className="absolute bottom-10 left-0 w-full flex gap-4 opacity-5 overflow-hidden whitespace-nowrap">
         {[...Array(10)].map((_, i) => (
           <div key={i} className="min-w-[100px] h-16 border-2 border-white rounded-md flex-shrink-0"></div>
         ))}
      </div>      
    </div>
  );
};

export default Loading;