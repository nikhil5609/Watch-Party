import React, { useState } from "react";
import { Chrome, Mail, Lock, UserCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { createUser } from "../../Store/user.slice";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    const user = { username, email, password };

    dispatch(createUser(user))
      .then((res) => {
        if (res?.payload?.user) {
          navigate("/");
        } else if (res?.error) {
          setError(res.error.message || "Registration failed. Try again.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Something went wrong. Please try again.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const loginWithGoogle = () => {
    const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/";
    window.location.href = `https://watch-party-backend-ry0f.onrender.com/auth/google?redirect=${encodeURIComponent(redirectPath)}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans complex-glow-container">
      {/* Background Glows - Scaled responsibly across breakpoints */}
      <div className="absolute top-[-5%] right-[-5%] md:top-[-10%] md:right-[-10%] w-[70%] h-[50%] md:w-[50%] bg-red-600/10 rounded-full blur-[100px] md:blur-[140px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-5%] left-[-5%] md:bottom-[-10%] md:left-[-10%] w-[60%] h-[40%] bg-blue-600/5 rounded-full blur-[90px] md:blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md my-auto">
        <div className="bg-slate-900/40 backdrop-blur-2xl p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2rem] border border-white/5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]">
          
          {/* HEADER */}
          <div className="mb-6 sm:mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-slate-400 mt-1.5 text-xs font-medium tracking-wide">
              Join the ultimate watch party. 🍿
            </p>
          </div>

          {/* GLOBAL ERROR DISPLAY */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-xs font-medium text-red-400">{error}</p>
            </div>
          )}

          {/* SINGLE GOOGLE REGISTER BUTTON */}
          <div className="mb-5 sm:mb-6">
            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white/[0.02] hover:bg-white/[0.06] disabled:opacity-50 disabled:hover:bg-white/[0.02] text-white py-3.5 sm:py-4 rounded-xl border border-white/10 transition-all active:scale-[0.99] group shadow-sm"
            >
              <Chrome
                size={18}
                className="text-slate-400 group-hover:text-red-500 group-disabled:group-hover:text-slate-400 transition-colors duration-300"
              />
              <span className="text-xs sm:text-sm font-semibold tracking-wide">
                Sign up with Google
              </span>
            </button>
          </div>

          {/* VISUAL DIVIDER */}
          <div className="relative mb-5 sm:mb-6 text-center select-none">
            <hr className="border-slate-800/80" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">
              Or register with email
            </span>
          </div>

          {/* FORM */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest opacity-80">
                User Name
              </label>
              <div className="relative group">
                <UserCircle
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors duration-300"
                  size={16}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-slate-950/40 border border-slate-800/80 focus:border-red-600/60 disabled:opacity-60 text-white rounded-xl pl-11 pr-4 py-3 sm:py-3.5 focus:ring-4 focus:ring-red-600/5 outline-none transition-all placeholder:text-slate-700 text-sm"
                  placeholder="Alex G."
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest opacity-80">
                Email Address
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors duration-300"
                  size={16}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-slate-950/40 border border-slate-800/80 focus:border-red-600/60 disabled:opacity-60 text-white rounded-xl pl-11 pr-4 py-3 sm:py-3.5 focus:ring-4 focus:ring-red-600/5 outline-none transition-all placeholder:text-slate-700 text-sm"
                  placeholder="alex@example.com"
                  required
                />
              </div>
            </div>

            {/* Password with Hide/Show */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest opacity-80">
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors duration-300"
                  size={16}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-slate-950/40 border border-slate-800/80 focus:border-red-600/60 disabled:opacity-60 text-white rounded-xl pl-11 pr-11 py-3 sm:py-3.5 focus:ring-4 focus:ring-red-600/5 outline-none transition-all placeholder:text-slate-700 text-sm"
                  placeholder="Min. 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 disabled:opacity-50 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button with Spinner */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-red-800 disabled:to-red-900 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl mt-6 transition-all shadow-[0_8px_20px_rgba(220,38,38,0.2)] hover:shadow-[0_12px_24px_rgba(220,38,38,0.3)] active:scale-[0.99] tracking-wider text-xs"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                "START WATCHING"
              )}
            </button>
          </form>

          {/* FOOTER */}
          <p className="mt-6 sm:mt-8 text-center text-slate-400 text-xs font-medium tracking-wide">
            Already a member?{" "}
            <Link
              to="/login"
              className="text-white font-semibold hover:text-red-400 transition-all underline underline-offset-4 decoration-red-600/40 hover:decoration-red-500"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;