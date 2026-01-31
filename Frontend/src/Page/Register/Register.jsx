import React, { useState } from 'react';
import { Github, Chrome, Mail, Lock, UserCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createUser } from '../../Store/user.slice';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for toggle

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = {
      username,
      email,
      password
    }
    dispatch(createUser(user))
    .then((res)=>{
      if(res?.payload?.user){
        localStorage.setItem('token',res?.payload?.token);
        navigate('/')
      }

    })
    .catch((err)=>{
      console.log(err);
      
    })
  };

  const loginWithGoogle = () => {
    window.location.href = `http://localhost:3300/auth/google`;
  };

  const loginWithGithub = () => {
    window.location.href = `http://localhost:3300/auth/github`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
          
          <div className="mb-8 text-center md:text-left md:flex md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Create Account</h2>
              <p className="text-slate-400 mt-1 text-sm font-medium">Join the ultimate watch party.</p>
            </div>
            <div className="hidden md:block text-4xl">🍿</div>
          </div>

          {/* Social Buttons */}
          <div className="flex gap-3 mb-8">
            <button type="button" onClick={loginWithGoogle} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-2xl border border-white/10 transition-all active:scale-95 group">
              <Chrome size={20} className="group-hover:text-red-500 transition-colors" />
              <span className="text-sm font-bold">Google</span>
            </button>
            <button type="button" onClick={loginWithGithub} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-2xl border border-white/10 transition-all active:scale-95 group">
              <Github size={20} className="group-hover:text-slate-400 transition-colors" />
              <span className="text-sm font-bold">GitHub</span>
            </button>
          </div>

          <div className="relative mb-8 text-center">
            <hr className="border-slate-800" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Or register with email</span>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">User Name</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700/50 text-white rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-red-600/50 focus:border-red-600 outline-none transition-all placeholder:text-slate-700"
                  placeholder="Alex G."
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // Changed from onClick to onChange
                  className="w-full bg-slate-800/40 border border-slate-700/50 text-white rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-red-600/50 focus:border-red-600 outline-none transition-all placeholder:text-slate-700"
                  placeholder="alex@example.com"
                  required
                />
              </div>
            </div>

            {/* Password with Hide/Show */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} // Dynamic type
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} // Changed from onClick to onChange
                  className="w-full bg-slate-800/40 border border-slate-700/50 text-white rounded-2xl pl-12 pr-12 py-3 focus:ring-2 focus:ring-red-600/50 focus:border-red-600 outline-none transition-all placeholder:text-slate-700"
                  placeholder="Min. 8 characters"
                  required
                />
                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type='submit' className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl mt-4 transition-all shadow-[0_10px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_15px_30px_rgba(220,38,38,0.4)] active:scale-[0.98] tracking-widest text-sm">
              START WATCHING
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 text-sm font-medium">
            Already a member? <Link to="/login" className="text-white font-bold hover:text-red-500 underline underline-offset-8 decoration-red-600/30 transition-all">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;