import React, { useState } from 'react';
import { Github, Mail, Lock, Chrome, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../Store/user.slice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate= useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const user = {
      email,
      password
    }
    setEmail("");
    setPassword("");
    dispatch(loginUser(user))
    .then((res)=>{
      if(res?.payload?.user){
        localStorage.setItem('token',res?.payload?.token);
        navigate('/')
      }
      else{
        setError(res.payload.error);
      }
    })
    .catch((err)=>{
      console.log(err);
    })
  };

  const loginWithGoogle = () => {
    window.location.href = `https://watch-party-backend-d12q.onrender.com/auth/google`;
  };

  const loginWithGithub = () => {
    window.location.href = `https://watch-party-backend-d12q.onrender.com/auth/github`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      
      {/* Background Image Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1485846234645-a62644ef7467?q=80&w=2000')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">

          {/* LOGO & HEADER */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-600 rounded-2xl mb-4 shadow-[0_0_30px_rgba(220,38,38,0.5)] transform -rotate-6">
              <span className="text-white text-2xl font-black">C</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              CINE<span className="text-red-600">SYNC</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 font-medium">Welcome back to the front row.</p>
          </div>

          {/* SOCIAL LOGIN BUTTONS */}
          <div className="flex gap-3 mb-8">
            <button
              type="button"
              onClick={loginWithGoogle}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-2xl border border-white/10 transition-all active:scale-95 group"
            >
              <Chrome size={20} className="group-hover:text-red-500 transition-colors" />
              <span className="text-sm font-bold">Google</span>
            </button>
            <button
              type="button"
              onClick={loginWithGithub}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-2xl border border-white/10 transition-all active:scale-95 group"
            >
              <Github size={20} className="group-hover:text-slate-400 transition-colors" />
              <span className="text-sm font-bold">GitHub</span>
            </button>
          </div>

          {/* VISUAL DIVIDER */}
          <div className="relative mb-8 text-center">
            <hr className="border-slate-800" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Or secure email login
            </span>
          </div>

          {/* EMAIL FORM */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700/50 text-white rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-red-600/50 focus:border-red-600 outline-none transition-all placeholder:text-slate-700"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between px-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700/50 text-white rounded-2xl pl-12 pr-12 py-4 focus:ring-2 focus:ring-red-600/50 focus:border-red-600 outline-none transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                />
                {/* Password Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className='h-5 w-full flex align-middle justify-between'>
              {error ? <p className='text-sm text-red-500 font-bold hover:text-red-400 transition-colors'>{error}</p> : <p></p>}
              <a href="#" className="text-xs text-red-500 font-bold hover:text-red-400 transition-colors">Forgot?</a>
            </div>
            <button type="submit" className="group w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl mt-4 transition-all shadow-[0_10px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_15px_30px_rgba(220,38,38,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 tracking-widest text-sm">
              SIGN IN
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* FOOTER */}
          <p className="mt-8 text-center text-slate-500 text-sm font-medium">
            New to the show? <Link to="/register" className="text-white font-bold hover:text-red-500 underline underline-offset-8 decoration-red-600/30 transition-all">Join CineSync</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
