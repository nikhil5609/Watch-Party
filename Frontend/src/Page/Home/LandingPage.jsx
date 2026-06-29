import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Mic,
  Zap,
  Smartphone,
  ChevronRight,
  Users,
  Menu,
  X,
  Star,
  ArrowRight,
} from "lucide-react";

const MOVIES = [
  {
    id: 1,
    title: "Stranger Things",
    genre: "Sci-Fi",
    viewers: "2.4k",
    rating: "9.2",
    img: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=600",
  },
  {
    id: 2,
    title: "The Batman",
    genre: "Action",
    viewers: "1.8k",
    rating: "8.7",
    img: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=600",
  },
  {
    id: 3,
    title: "Interstellar",
    genre: "Sci-Fi",
    viewers: "3.1k",
    rating: "9.6",
    img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=600",
  },
  {
    id: 4,
    title: "Blade Runner",
    genre: "Cyberpunk",
    viewers: "900",
    rating: "8.4",
    img: "https://images.unsplash.com/photo-1605806616949-1e87b487fc2f?q=80&w=600",
  },
];

const STATS = [
  { value: "4M+", label: "Watch parties hosted" },
  { value: "180+", label: "Countries watching" },
  { value: "99.9%", label: "Sync accuracy" },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMovie, setActiveMovie] = useState(0);
  const tickerRef = useRef(null);

  // Simple navigation handler
  const navigateToLogin = (e) => {
    if (e) e.preventDefault();
    window.location.href = "/login";
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMovie((prev) => (prev + 1) % MOVIES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07070f",
        color: "#f0eef8",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(200,16,65,0.35); }
        ::-webkit-scrollbar { width: 4px; background: #0a0a14; }
        ::-webkit-scrollbar-thumb { background: #c8102e; border-radius: 2px; }
        
        .nav-link { color: #8885a0; font-size: 14px; font-weight: 500; text-decoration: none; transition: color .2s; cursor: pointer; }
        .nav-link:hover { color: #f0eef8; }
        
        .btn-primary { background: #c8102e; color: #fff; border: none; padding: 14px 28px; border-radius: 100px; font-weight: 700; font-size: 15px; cursor: pointer; transition: all .2s; letter-spacing: -.01em; display: inline-flex; align-items: center; gap: 8px; justify-content: center; text-decoration: none; }
        .btn-primary:hover { background: #e8192e; transform: translateY(-1px); }
        .btn-primary:active { transform: scale(0.97); }
        
        .btn-ghost { background: transparent; color: #f0eef8; border: 1px solid rgba(255,255,255,.15); padding: 14px 28px; border-radius: 100px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all .2s; display: inline-flex; align-items: center; gap: 8px; justify-content: center; text-decoration: none; }
        .btn-ghost:hover { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.3); }
        
        .movie-card { position: relative; border-radius: 20px; overflow: hidden; cursor: pointer; transition: transform .3s; width: 100%; }
        .movie-card:hover { transform: translateY(-6px); }
        .movie-card img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .5s; }
        .movie-card:hover img { transform: scale(1.05); }
        
        .live-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(200,16,46,.85); backdrop-filter: blur(8px); padding: 5px 11px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: .06em; }
        .live-dot { width: 6px; height: 6px; background: #fff; border-radius: 50%; animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
        
        .ping { width: 8px; height: 8px; border-radius: 50%; background: #22ff88; position: relative; flex-shrink: 0; }
        .ping::after { content:''; position:absolute; inset:-3px; border-radius:50%; background:rgba(34,255,136,.3); animation: pingAnim 1.4s ease-out infinite; }
        @keyframes pingAnim { 0% { transform:scale(1); opacity:.8; } 100% { transform:scale(2); opacity:0; } }
        
        .ticker-track { display: flex; gap: 16px; animation: scroll 28s linear infinite; width: max-content; }
        .ticker-track:hover { animation-play-state: paused; }
        @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        
        .stat-item { text-align: center; padding: 32px 24px; border-right: 1px solid rgba(255,255,255,.07); }
        .stat-item:last-child { border-right: none; }
        .footer-link { color: #8885a0; font-size: 13px; font-weight: 500; text-decoration: none; transition: color .2s; }
        .footer-link:hover { color: #f0eef8; }

        /* Responsive Breakpoints */
        @media (max-width: 991px) {
          .desktop-nav { display: none !important; }
        }
        @media (max-width: 768px) {
          .stat-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,.07); }
          .stat-item:last-child { border-bottom: none; }
          .floating-sync-card { display: none !important; }
        @media (max-width: 991px) {
          .desktop-nav, .hide-on-mobile { display: none !important; }
        }
        }
      `}</style>

      {/* ─── Navbar ─── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 min(24px, 4vw)",
          background: scrolled ? "rgba(7,7,15,.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,.06)"
            : "1px solid transparent",
          transition: "all .3s",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 68,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#c8102e",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(-5deg)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: "#fff",
                transform: "rotate(5deg)",
                display: "block",
              }}
            >
              ▶
            </span>
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: "-.04em",
              color: "#fff",
            }}
          >
            CINE<span style={{ color: "#c8102e" }}>SYNC</span>
          </span>
        </div>

        {/* Desktop nav controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Changed from <a> to <button> and added the responsive utility class */}
          <button
            onClick={navigateToLogin}
            className="nav-link hide-on-mobile"
            style={{ background: "none", border: "none", padding: 0 }}
          >
            Sign in
          </button>

          {/* Added the responsive utility class */}
          <button
            onClick={navigateToLogin}
            className="btn-primary hide-on-mobile"
            style={{ padding: "10px 22px", fontSize: 14 }}
          >
            Start free
          </button>

          {/* The Menu button stays visible so users can still access actions on mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 10,
              padding: 8,
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 68,
            left: 0,
            right: 0,
            zIndex: 99,
            background: "rgba(10,10,20,.97)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,.08)",
            padding: "24px min(24px, 4vw)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={navigateToLogin}
              className="btn-ghost"
              style={{ width: "100%" }}
            >
              Sign in
            </button>
            <button
              onClick={navigateToLogin}
              className="btn-primary"
              style={{ width: "100%" }}
            >
              Start free
            </button>
          </div>
        </div>
      )}

      {/* ─── Hero ─── */}
      <section
        style={{
          minHeight: "100vh",
          padding: "120px min(24px, 4vw) 80px",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* BG glow accents */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(700px, 100vw)",
            height: 600,
            background:
              "radial-gradient(ellipse, rgba(200,16,46,.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "-10%",
            width: 500,
            height: 400,
            background:
              "radial-gradient(ellipse, rgba(80,30,180,.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            width: "100%",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 400px), 1fr))",
            gap: "40px",
            alignItems: "center",
          }}
        >
          {/* Left Hero Content */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.1)",
                padding: "6px 14px",
                borderRadius: 100,
                marginBottom: 24,
              }}
            >
              <span className="ping" />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  color: "#22ff88",
                  textTransform: "uppercase",
                }}
              >
                4K rooms live now
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(38px, 5.5vw, 76px)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-.04em",
                marginBottom: 24,
              }}
            >
              Watch
              <br />
              <span style={{ color: "#c8102e" }}>together.</span>
              <br />
              <span style={{ color: "#8885a0" }}>Feel it</span>
              <br />
              together.
            </h1>

            <p
              style={{
                fontSize: "clamp(16px, 1.8vw, 19px)",
                color: "#8885a0",
                lineHeight: 1.6,
                maxWidth: 460,
                marginBottom: 36,
                fontWeight: 400,
              }}
            >
              Stream any movie with up to 50 friends. Synchronized to the frame,
              with voice chat that feels like sitting side by side.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 36,
              }}
            >
              <button
                onClick={navigateToLogin}
                className="btn-primary"
                style={{ fontSize: 16, flex: "1 1 auto" }}
              >
                Create a room <ArrowRight size={18} />
              </button>
              <button
                onClick={navigateToLogin}
                className="btn-ghost"
                style={{ fontSize: 16, flex: "1 1 auto" }}
              >
                <Play size={18} style={{ fill: "currentColor" }} /> Explore
                movies
              </button>
            </div>

            <div
              style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px" }}
            >
              {[
                ["No credit card", "✓"],
                ["Free forever tier", "✓"],
                ["Cancel anytime", "✓"],
              ].map(([label, mark]) => (
                <span
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#6663a0",
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: "#22ff88", fontWeight: 700 }}>
                    {mark}
                  </span>{" "}
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right Movie Preview Showcase */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 460,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                borderRadius: 28,
                overflow: "hidden",
                position: "relative",
                aspectRatio: "3/4",
                background: "#111",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            >
              {MOVIES.map((movie, i) => (
                <div
                  key={movie.id}
                  style={{
                    position: "absolute",
                    inset: 0,
                    transition: "opacity .8s",
                    opacity: i === activeMovie ? 1 : 0,
                  }}
                >
                  <img
                    src={movie.img}
                    alt={movie.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,.9) 0%, transparent 50%)",
                    }}
                  />
                </div>
              ))}

              {/* interactive card interface overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "min(24px, 5vw)",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginBottom: 16,
                    gap: 12,
                  }}
                >
                  <div>
                    <div className="live-badge" style={{ marginBottom: 10 }}>
                      <span className="live-dot" />
                      {MOVIES[activeMovie].viewers} WATCHING
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(18px, 3vw, 22px)",
                        fontWeight: 800,
                        letterSpacing: "-.02em",
                      }}
                    >
                      {MOVIES[activeMovie].title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#8885a0",
                        textTransform: "uppercase",
                        letterSpacing: ".1em",
                        marginTop: 4,
                      }}
                    >
                      {MOVIES[activeMovie].genre}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "rgba(255,255,255,.1)",
                      padding: "6px 10px",
                      borderRadius: 10,
                      backdropFilter: "blur(8px)",
                      flexShrink: 0,
                    }}
                  >
                    <Star
                      size={13}
                      style={{ fill: "#f5a623", color: "#f5a623" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      {MOVIES[activeMovie].rating}
                    </span>
                  </div>
                </div>

                {/* progress track */}
                <div
                  style={{
                    background: "rgba(255,255,255,.15)",
                    height: 3,
                    borderRadius: 10,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      background: "#c8102e",
                      height: "100%",
                      borderRadius: 10,
                      width: "42%",
                    }}
                  />
                </div>

                {/* profile avatars & dynamic entry handler */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex" }}>
                    {["A", "B", "C", "+4"].map((v, i) => (
                      <div
                        key={i}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background:
                            i === 3
                              ? "rgba(255,255,255,.15)"
                              : `hsl(${i * 80 + 180},60%,45%)`,
                          border: "2px solid #07070f",
                          marginLeft: i === 0 ? 0 : -8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {v}
                      </div>
                    ))}
                    <span
                      style={{
                        marginLeft: 10,
                        fontSize: 13,
                        color: "#8885a0",
                        fontWeight: 500,
                        alignSelf: "center",
                      }}
                    >
                      watching
                    </span>
                  </div>
                  <button
                    onClick={navigateToLogin}
                    style={{
                      background: "#c8102e",
                      border: "none",
                      borderRadius: 100,
                      padding: "8px 16px",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Users size={13} /> Join room
                  </button>
                </div>
              </div>
            </div>

            {/* Floating sync indicator component */}
            <div
              className="floating-sync-card"
              style={{
                position: "absolute",
                top: -12,
                right: -12,
                background: "rgba(255,255,255,.07)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 16,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                zIndex: 3,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#22ff88",
                  flexShrink: 0,
                }}
              />
              <span
                style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}
              >
                Synced · 0ms lag
              </span>
            </div>

            {/* Slider triggers */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 6,
                marginTop: 20,
              }}
            >
              {MOVIES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMovie(i)}
                  style={{
                    width: i === activeMovie ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background:
                      i === activeMovie ? "#c8102e" : "rgba(255,255,255,.2)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all .3s",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Ticker Stream ─── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,.06)",
          borderBottom: "1px solid rgba(255,255,255,.06)",
          padding: "18px 0",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", overflow: "hidden" }} ref={tickerRef}>
          <div className="ticker-track">
            {[...MOVIES, ...MOVIES].map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={m.img}
                    alt={m.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    color: "#8885a0",
                  }}
                >
                  {m.title}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#c8102e",
                    fontWeight: 700,
                    marginRight: 24,
                  }}
                >
                  ●
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Data Stats Grid ─── */}
      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "64px min(24px, 4vw)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            background: "rgba(255,255,255,.03)",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 24,
          }}
        >
          {STATS.map((s, i) => (
            <div key={i} className="stat-item">
              <div
                style={{
                  fontSize: "clamp(32px, 5vw, 48px)",
                  fontWeight: 900,
                  letterSpacing: "-.04em",
                  color: "#f0eef8",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#6663a0",
                  fontWeight: 500,
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Trending Rooms ─── */}
      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 min(24px, 4vw) 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 32,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".15em",
                color: "#c8102e",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Live right now
            </p>
            <h2
              style={{
                fontSize: "clamp(24px, 4vw, 38px)",
                fontWeight: 900,
                letterSpacing: "-.03em",
                lineHeight: 1.1,
              }}
            >
              Trending rooms
            </h2>
          </div>
          <a
            href="/login"
            onClick={navigateToLogin}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "#c8102e",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            View all <ChevronRight size={16} />
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
            gap: "24px",
          }}
        >
          {MOVIES.map((movie) => (
            <div
              key={movie.id}
              className="movie-card"
              onClick={navigateToLogin}
            >
              <div
                style={{
                  aspectRatio: "3/4",
                  background: "#111",
                  borderRadius: 20,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <img src={movie.img} alt={movie.title} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,.8) 0%, transparent 55%)",
                  }}
                />
                <div style={{ position: "absolute", top: 14, left: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "rgba(0,0,0,.55)",
                      backdropFilter: "blur(8px)",
                      padding: "4px 10px",
                      borderRadius: 20,
                      border: "1px solid rgba(255,255,255,.1)",
                    }}
                  >
                    <Star
                      size={11}
                      style={{ fill: "#f5a623", color: "#f5a623" }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 700 }}>
                      {movie.rating}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 16,
                    left: 14,
                    right: 14,
                  }}
                >
                  <div
                    className="live-badge"
                    style={{ marginBottom: 8, fontSize: 10 }}
                  >
                    <span className="live-dot" />
                    {movie.viewers} WATCHING
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: "-.02em",
                    }}
                  >
                    {movie.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#8885a0",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      marginTop: 3,
                    }}
                  >
                    {movie.genre}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Action CTA Banner ─── */}
      <section style={{ padding: "0 min(24px, 4vw) 80px" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            background:
              "linear-gradient(135deg, rgba(200,16,46,.18) 0%, rgba(80,30,180,.15) 100%)",
            border: "1px solid rgba(200,16,46,.25)",
            borderRadius: 32,
            padding: "clamp(32px, 6vw, 72px)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 600,
              height: 400,
              background:
                "radial-gradient(ellipse, rgba(200,16,46,.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: ".15em",
              color: "#c8102e",
              textTransform: "uppercase",
              marginBottom: 16,
              position: "relative",
            }}
          >
            Start tonight
          </p>
          <h2
            style={{
              fontSize: "clamp(26px, 4.5vw, 54px)",
              fontWeight: 900,
              letterSpacing: "-.04em",
              marginBottom: 20,
              lineHeight: 1.1,
              position: "relative",
            }}
          >
            Your next movie night
            <br />
            is one click away.
          </h2>
          <p
            style={{
              fontSize: 17,
              color: "#8885a0",
              marginBottom: 36,
              position: "relative",
            }}
          >
            Free forever. No ads. No buffering.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              justifyContent: "center",
              position: "relative",
            }}
          >
            <button
              onClick={navigateToLogin}
              className="btn-primary"
              style={{ fontSize: 16, padding: "14px 32px" }}
            >
              Create a free room <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,.06)",
          padding: "48px min(24px, 4vw) 32px",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "#c8102e",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "rotate(-5deg)",
                  flexShrink: 0,
                }}
              >
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
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 900,
                  letterSpacing: "-.04em",
                  color: "#fff",
                }}
              >
                CINE<span style={{ color: "#c8102e" }}>SYNC</span>
              </span>
            </div>
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: "16px 28px" }}
            >
              {["Privacy", "Terms", "Support", "Careers"].map((l) => (
                <a key={l} href="#" className="footer-link">
                  {l}
                </a>
              ))}
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,.06)",
              paddingTop: 24,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p style={{ fontSize: 13, color: "#3a3850" }}>
              © 2026 CineSync Inc. All rights reserved.
            </p>
            <p style={{ fontSize: 13, color: "#3a3850" }}>
              Built for the next generation of movie lovers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
