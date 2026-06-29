import React, { useState } from "react";
import { Mail, Lock, Chrome, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginUser } from "../../Store/user.slice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const redirectTo =
    location.state?.from?.pathname ||
    sessionStorage.getItem("redirectAfterLogin") ||
    "/";

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const user = {
      email,
      password,
    };
    setEmail("");
    setPassword("");
    dispatch(loginUser(user))
      .then((res) => {
        if (res?.payload?.user) {
          sessionStorage.removeItem("redirectAfterLogin");
          navigate(redirectTo, { replace: true });
        } else {
          setError(res.payload.error);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const loginWithGoogle = () => {
    const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/";
    window.location.href = `https://watch-party-backend-ry0f.onrender.com/auth/google?redirect=${encodeURIComponent(redirectPath)}`;
  };

  return (
    <div className="min-h-screen bg-[#07070f] text-[#f0eef8] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Radial Glows matching Landing Page Accent colors */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[700px] h-[500px] bg-radial-gradient from-[#c8102e]/12 to-transparent pointer-events-none blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-radial-gradient from-[#501eb4]/08 to-transparent pointer-events-none blur-3xl"></div>

      {/* Seamless Ambient Film Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] bg-cover bg-center mix-blend-luminosity pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1485846234645-a62644ef7467?q=80&w=2000')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070f] via-transparent to-[#07070f]"></div>
      </div>

      {/* Card Wrapper Component */}
      <div className="relative z-10 w-full max-w-[440px] mx-auto transition-all duration-300">
        <div className="bg-white/[0.02] backdrop-blur-2xl p-6 sm:p-10 rounded-[24px] border border-white/[0.06] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)]">
          {/* LOGO & HEADER */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-11 h-11 bg-[#c8102e] rounded-xl mb-4 shadow-[0_0_25px_rgba(200,16,46,0.3)] transform -rotate-6 hover:rotate-0 transition-transform duration-300">
              {/* Change this back to your original character */}
              <span
                  style={{
                    fontSize: 14,
                    fontWeight: 900,
                    color: "#fff",
                    transform: "rotate(5deg)",
                    display: "block",
                  }}
                >
                  ▶
                </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              CINE<span className="text-[#c8102e]">SYNC</span>
            </h1>
            <p className="text-[#8885a0] text-xs sm:text-sm mt-2 font-medium tracking-wide">
              Welcome back to the front row.
            </p>
          </div>

          {/* OAUTH GOOGLE INTEGRATION */}
          <div className="mb-6">
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] text-white py-3.5 px-4 rounded-xl border border-white/[0.08] transition-all duration-200 active:scale-[0.98] group font-semibold text-sm tracking-wide"
            >
              <Chrome
                size={18}
                className="text-[#8885a0] group-hover:text-[#c8102e] transition-colors duration-200"
              />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* STYLED VISUAL DIVIDER */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-full border-t border-white/[0.06]"></div>
            <span className="absolute bg-[#0b0b16] px-3 text-[10px] font-bold text-[#6663a0] uppercase tracking-[0.18em] whitespace-nowrap">
              or use email
            </span>
          </div>

          {/* FORM CONTEXT */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* EMAIL ACCESS CONTROL */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#8885a0] uppercase ml-1 tracking-widest block">
                Email Address
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6663a0] group-focus-within:text-[#c8102e] transition-colors duration-200"
                  size={16}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/[0.08] focus:border-[#c8102e]/80 text-white rounded-xl pl-11 pr-4 py-3.5 focus:ring-4 focus:ring-[#c8102e]/10 outline-none transition-all placeholder:text-[#3a3850] text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* PASSWORD ACCESS CONTROL */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#8885a0] uppercase tracking-widest ml-1 block">
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6663a0] group-focus-within:text-[#c8102e] transition-colors duration-200"
                  size={16}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/[0.08] focus:border-[#c8102e]/80 text-white rounded-xl pl-11 pr-11 py-3.5 focus:ring-4 focus:ring-[#c8102e]/10 outline-none transition-all placeholder:text-[#3a3850] text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6663a0] hover:text-[#f0eef8] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* STATE feedback ROW */}
            <div className="min-h-[20px] w-full flex items-start justify-between px-1 text-xs gap-4">
              {error ? (
                <p className="text-[#c8102e] font-semibold animate-[fadeIn_0.2s_ease-out]">
                  {error}
                </p>
              ) : (
                <div />
              )}
              <a
                href="#"
                className="text-[#8885a0] font-medium hover:text-[#c8102e] transition-colors ml-auto shrink-0"
              >
                Forgot password?
              </a>
            </div>

            {/* ACTION TRIGGER */}
            <button
              type="submit"
              className="group w-full bg-[#c8102e] hover:bg-[#e8192e] text-white font-bold py-3.5 rounded-xl mt-2 transition-all duration-200 shadow-[0_8px_24px_rgba(200,16,46,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 tracking-wider text-xs"
            >
              SIGN IN
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform duration-200"
              />
            </button>
          </form>

          {/* FOOTER ANCHOR */}
          <p className="mt-8 text-center text-[#8885a0] text-xs sm:text-sm font-medium tracking-wide">
            New to the show?{" "}
            <Link
              to="/register"
              className="text-white font-semibold hover:text-[#c8102e] transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-[#c8102e]"
            >
              Join CineSync
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
