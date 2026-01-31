import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loading from '../Loading/Loading'; 
import { Play, Mic, Zap, Smartphone, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const user = useSelector(state => state.user);
  
  const trendingMovies = [
    { id: 1, title: "Stranger Things", genre: "Sci-Fi", img: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=600", viewers: "2.4k" },
    { id: 2, title: "The Batman", genre: "Action", img: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=600", viewers: "1.8k" },
    { id: 3, title: "Interstellar", genre: "Sci-Fi", img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=600", viewers: "3.1k" },
    { id: 4, title: "Blade Runner", genre: "Cyberpunk", img: "https://images.unsplash.com/photo-1605806616949-1e87b487fc2f?q=80&w=600", viewers: "900" },
  ];

  if (user?.loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-red-500/30 overflow-x-hidden">
      
      {/* --- Sticky Navbar --- */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm transform -rotate-6">C</div>
          CINE<span className="text-red-600">SYNC</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Sign In</Link>
          <Link to="/register" className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-2xl text-sm font-black transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95">
            JOIN FOR FREE
          </Link>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <header className="relative pt-48 pb-32 px-6 text-center">
        {/* Abstract Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent -z-10 animate-pulse"></div>
        
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] text-red-500 mb-8 uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Now supporting 4K Streaming
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            DON'T WATCH ALONE.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-red-600">
              WATCH TOGETHER.
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            The ultimate platform to stream your favorite movies with friends. 
            Sync up your screens, jump on a call, and never miss a reaction.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <Link to="/register" className="group bg-white text-black px-10 py-5 rounded-2xl font-black text-lg hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2">
              CREATE A PARTY <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to={"/login"} className="bg-slate-900 border border-slate-800 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              <Play size={20} className="fill-current" /> BROWSE MOVIES
            </Link>
          </div>
        </div>
      </header>

      {/* --- Trending Section --- */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-2 uppercase">Trending Now</h2>
            <p className="text-slate-500 font-medium">Join an active room and start watching instantly.</p>
          </div>
          <Link to="/register" className="text-red-500 font-bold hover:text-red-400 transition-colors flex items-center gap-1">
            VIEW ALL <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trendingMovies.map((movie) => (
            <div key={movie.id} className="group cursor-pointer">
              <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden mb-5 border border-white/5">
                <img
                  src={movie.img}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                <div className="absolute bottom-5 left-5 right-5">
                   <div className="bg-red-600/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black border border-white/10 inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    {movie.viewers} WATCHING
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-black group-hover:text-red-500 transition-colors">{movie.title}</h3>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">{movie.genre}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Features Section --- */}
      <section className="bg-slate-900/20 py-32 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-16">
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] border border-white/10 flex items-center justify-center mb-6 group-hover:border-red-600/50 transition-all">
              <Mic className="text-red-500" size={32} />
            </div>
            <h4 className="text-xl font-black mb-3">Crystal Clear Audio</h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">Low-latency voice chat that makes you feel like you're in the same row at the cinema.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] border border-white/10 flex items-center justify-center mb-6 group-hover:border-red-600/50 transition-all">
              <Zap className="text-red-500" size={32} />
            </div>
            <h4 className="text-xl font-black mb-3">Zero-Lag Sync</h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">Our proprietary sync tech ensures every explosion and line of dialogue hits at the same time.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] border border-white/10 flex items-center justify-center mb-6 group-hover:border-red-600/50 transition-all">
              <Smartphone className="text-red-500" size={32} />
            </div>
            <h4 className="text-xl font-black mb-3">Any Device</h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">Whether you're on a 4K TV or a smartphone, the party never stops.</p>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-20 px-6 text-center">
        <div className="text-2xl font-black mb-6 tracking-tighter">
          CINE<span className="text-red-600">SYNC</span>
        </div>
        <p className="text-slate-500 text-sm font-medium mb-10">Built for the next generation of movie lovers.</p>
        <div className="flex justify-center gap-8 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
          <a href="#" className="hover:text-red-500 transition-colors">Privacy</a>
          <a href="#" className="hover:text-red-500 transition-colors">Terms</a>
          <a href="#" className="hover:text-red-500 transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;