import React, { useState } from 'react';
import { Mail, Lock, Chrome, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../Store/user.slice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const user = {
      email,
      password
    };
    setEmail("");
    setPassword("");
    dispatch(loginUser(user))
      .then((res) => {
        if (res?.payload?.user) {
          navigate('/');
        } else {
          setError(res.payload.error);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const loginWithGoogle = () => {
    window.location.href = `https://watch-party-backend-ry0f.onrender.com/auth/google`;
  };

  const loginWithGithub = () => {
    window.location.href = `https://watch-party-backend-ry0f.onrender.com/auth/github`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Animated Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/15 rounded-full blur-[140px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      
      {/* Background Image Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-25 bg-cover bg-center mix-blend-luminosity"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1485846234645-a62644ef7467?q=80&w=2000')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/60 backdrop-blur-3xl p-8 md:p-10 rounded-[2rem] border border-white/5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">

          {/* LOGO & HEADER */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl mb-4 shadow-[0_0_30px_rgba(220,38,38,0.3)] transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-white text-xl font-black tracking-tighter">C</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              CINE<span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">SYNC</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1.5 font-medium tracking-wide">Welcome back to the front row.</p>
          </div>

          {/* SINGLE GOOGLE LOGIN BUTTON */}
          <div className="mb-6">
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/[0.07] text-white py-4 rounded-xl border border-white/10 transition-all active:scale-[0.99] group shadow-sm"
            >
              <Chrome size={18} className="text-slate-400 group-hover:text-red-500 transition-colors duration-300" />
              <span className="text-sm font-semibold tracking-wide">Continue with Google</span>
            </button>
          </div>

          {/* VISUAL DIVIDER */}
          <div className="relative mb-6 text-center">
            <hr className="border-slate-800/60" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">
              or use email
            </span>
          </div>

          {/* EMAIL FORM */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest opacity-80">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors duration-300" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 focus:border-red-600/80 text-white rounded-xl pl-11 pr-4 py-3.5 focus:ring-4 focus:ring-red-600/10 outline-none transition-all placeholder:text-slate-600 text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-80 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors duration-300" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 focus:border-red-600/80 text-white rounded-xl pl-11 pr-11 py-3.5 focus:ring-4 focus:ring-red-600/10 outline-none transition-all placeholder:text-slate-600 text-sm"
                  placeholder="••••••••"
                />
                {/* Password Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error and Forgot Password Alignment */}
            <div className='min-h-[20px] w-full flex items-center justify-between px-1 text-xs'>
              {error ? (
                <p className='text-red-500 font-semibold animate-fadeIn'>{error}</p>
              ) : (
                <div></div>
              )}
              <a href="#" className="text-slate-400 font-medium hover:text-red-400 transition-colors ml-auto">
                Forgot password?
              </a>
            </div>

            <button 
              type="submit" 
              className="group w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 rounded-xl mt-2 transition-all shadow-[0_8px_20px_rgba(220,38,38,0.25)] hover:shadow-[0_12px_24px_rgba(220,38,38,0.35)] active:scale-[0.99] flex items-center justify-center gap-2 tracking-wider text-xs"
            >
              SIGN IN
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-300" />
            </button>
          </form>

          {/* FOOTER */}
          <p className="mt-8 text-center text-slate-400 text-xs font-medium tracking-wide">
            New to the show?{' '}
            <Link to="/register" className="text-white font-semibold hover:text-red-400 transition-all underline underline-offset-4 decoration-red-600/40 hover:decoration-red-500">
              Join CineSync
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;