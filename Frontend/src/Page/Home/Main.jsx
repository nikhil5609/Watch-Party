import {
  PlusCircle,
  Users,
  LogOut,
  Library,
  Plus,
  Globe,
  Trash2,
  ExternalLink,
  Loader2,
  X,
  Film,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../Store/user.slice";
import { useNavigate } from "react-router-dom";
import { createRoom, joinRoom } from "../../Store/room.slice";
import { useState, useEffect } from "react";
import { axiosClient } from "../../Api/api";
import { log } from "firebase/firestore/pipelines";

const Main = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  // UI States
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Data State
  const [movies, setMovies] = useState([]);

  // --- FETCH DYNAMIC DATA ---
  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/movie/get-movies");
      setMovies(res.data.movies || []);
    } catch (err) {
      console.error("Failed to fetch library", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMovie = async (movieId) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      await axiosClient.delete(`/movie/delete/${movieId}`);
      setMovies((prev) => prev.filter((m) => m._id !== movieId));
    } catch (err) {
      alert("Only the uploader can delete this movie.");
    }
  };

  // --- HANDLERS ---
  const handleLogout = () => {
    dispatch(logoutUser()).then(() => navigate("/"));
  };

  const createRoomHandler = (selectedMovie = null, movieTitle) => {
    dispatch(
      createRoom({movieKey:selectedMovie,movieTitle:movieTitle}),
    ).then((res) => {
      if (res.payload?.success || res.payload?.room) {
        const roomCode = res.payload?.room?.roomCode;
        localStorage.setItem("roomId", roomCode);
        navigate(`/room/${roomCode}`, { state: { movie: selectedMovie } });
        setShowCreatePopup(false);
      }
    });
  };

  const joinRoomHandler = () => {
    const cleanRoomId = roomId.trim();
    if (!/^[A-Z0-9]{6}$/.test(cleanRoomId)) {
      setError("Room ID must be 6 characters");
      return;
    }
    dispatch(joinRoom(cleanRoomId)).then((res) => {
      if (res.payload?.success || res.payload?.room) {
        setShowJoinPopup(false);
        localStorage.setItem("roomId", res.payload?.room?.roomCode);
        navigate(`/room/${res.payload?.room?.roomCode}`);
      } else {
        setError("Invalid Room ID");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#07070f] text-[#f0eef8] flex flex-col md:flex-row font-sans selection:bg-[#c8102e]/30 relative overflow-x-hidden">
      
      {/* Background Ambient Aesthetics */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[50%] bg-[#c8102e]/05 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-blue-600/03 rounded-full blur-[120px] pointer-events-none"></div>

      {/* --- SIDEBAR --- */}
      <aside className="w-full md:w-24 lg:w-64 bg-[#0a0a14]/80 border-b md:border-b-0 md:border-r border-white/[0.04] p-4 sm:p-6 flex flex-row md:flex-col items-center md:items-stretch justify-between md:justify-start z-40 backdrop-blur-xl sticky top-0 md:h-screen">
        <div className="flex items-center gap-3 md:px-2 md:mb-12">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-[#c8102e] to-[#ef4444] rounded-xl flex items-center justify-center font-black text-lg sm:text-xl text-white shadow-[0_4px_20px_rgba(200,16,46,0.3)] select-none italic tracking-tighter">
            C
          </div>
          <span className="text-base sm:text-lg font-black tracking-tighter hidden lg:block italic uppercase text-white">
            Cine<span className="text-[#c8102e]">Sync</span>
          </span>
        </div>

        <nav className="flex flex-row md:flex-col items-center md:items-stretch gap-2 md:gap-4 md:flex-1">
          <NavItem
            icon={<Library size={20} />}
            label="Library"
            active={true}
            onClick={() => navigate("/library")}
          />
          <NavItem
            icon={<PlusCircle size={20} />}
            label="Create Room"
            onClick={() => setShowCreatePopup(true)}
          />
        </nav>

        <div className="flex md:flex-col items-center gap-4 md:gap-0 md:pt-6 md:border-t border-white/[0.04]">
          <div className="flex items-center gap-3 md:px-2 md:mb-6">
            <img
              src={user?.profilePicture}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/10 object-cover bg-slate-900"
              alt="pfp"
            />
            <div className="hidden lg:block overflow-hidden max-w-[120px]">
              <p className="text-xs sm:text-sm font-bold truncate text-white">
                {user?.username}
              </p>
              <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span> Online
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:w-full rounded-xl text-[#8885a0] hover:text-[#c8102e] hover:bg-white/[0.02] transition-all group font-bold text-xs"
          >
            <LogOut
              size={18}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:h-screen overflow-y-auto relative z-10 custom-scrollbar">
        <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-8 sm:space-y-10">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between pt-4 md:pt-0">
            <div className="space-y-1.5 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Welcome back, {user?.username}.
              </h1>
              <p className="text-[#8885a0] text-xs sm:text-sm font-medium">
                Ready for a watch party? Pick a movie or start a customized synchronous room.
              </p>
            </div>

            <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => {
                  setShowJoinPopup(true);
                  setError("");
                  setRoomId("");
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/[0.02] border border-white/10 hover:border-white/20 px-4 sm:px-6 py-3.5 rounded-xl font-bold text-xs tracking-wider text-white hover:bg-white/[0.05] transition-all active:scale-95 whitespace-nowrap"
              >
                <Users size={16} /> JOIN ROOM
              </button>
              <button
                onClick={() => setShowCreatePopup(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-[#c8102e] to-[#ef4444] px-4 sm:px-6 py-3.5 rounded-xl font-black text-xs tracking-wider text-white shadow-lg shadow-[#c8102e]/15 hover:shadow-[#c8102e]/25 hover:from-[#b00e28] hover:to-[#e13b3b] transition-all active:scale-95 whitespace-nowrap"
              >
                <PlusCircle size={16} /> START PARTY
              </button>
            </div>
          </div>

          <hr className="border-white/[0.04]" />

          {/* DYNAMIC LIBRARY GRID */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#c8102e]/10 border border-[#c8102e]/20 rounded-xl text-[#c8102e]">
                  <Globe size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Shared Media Library
                  </h2>
                  <p className="text-[10px] text-[#8885a0] font-bold uppercase tracking-widest mt-0.5">
                    Community Collection
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/library")}
                className="bg-white text-black hover:bg-slate-200 px-4 py-2.5 rounded-xl font-black text-xs tracking-wide flex items-center justify-center gap-2 transition-colors shadow-md active:scale-95 self-start sm:self-auto"
              >
                <Plus size={16} /> ADD TO LIBRARY
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="animate-spin text-[#c8102e]" size={36} />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                {movies.map((movie) => (
                  <div key={movie._id} className="group flex flex-col h-full">
                    <div className="aspect-[2/3] bg-gradient-to-b from-white/[0.01] to-white/[0.03] rounded-2xl overflow-hidden border border-white/[0.05] group-hover:border-[#c8102e]/40 transition-all relative shadow-lg group-hover:shadow-[#c8102e]/05">
                      <img
                        src={`https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400`}
                        className="w-full h-full object-cover opacity-25 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                        alt={movie.movieName}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#07070f] via-[#07070f]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-4 sm:p-5 gap-2.5">
                        <button
                          onClick={() =>
                            createRoomHandler(movie?.movieKey, movie?.movieName)
                          }
                          className="w-full py-3 bg-[#c8102e] hover:bg-[#b00e28] text-white rounded-xl font-black text-[10px] tracking-widest uppercase shadow-md transition-colors"
                        >
                          PLAY IN ROOM
                        </button>
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() =>
                              window.open(movie.movieUrl, "_blank")
                            }
                            className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg flex items-center justify-center transition-colors"
                            title="Open URL"
                          >
                            <ExternalLink size={14} />
                          </button>
                          {user?._id === movie.uploader?._id && (
                            <button
                              onClick={() => deleteMovie(movie._id)}
                              className="flex-1 py-2.5 bg-[#c8102e]/10 border border-[#c8102e]/20 text-[#ef4444] hover:bg-[#c8102e]/20 rounded-lg flex items-center justify-center transition-colors"
                              title="Delete Media"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3.5 px-1 flex-1 flex flex-col justify-between">
                      <h4 className="font-bold text-white text-sm truncate group-hover:text-[#c8102e] transition-colors tracking-tight">
                        {movie.movieName}
                      </h4>
                      <p className="text-[10px] text-[#8885a0] font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 bg-[#c8102e] rounded-full flex-shrink-0"></span>
                        <span className="truncate">
                          {user?._id === movie.uploader?._id
                            ? "Added by you"
                            : `By ${movie.uploader?.username}`}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* JOIN ROOM POPUP */}
      {showJoinPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b0b14] border border-white/[0.06] rounded-2xl p-6 sm:p-10 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 text-center tracking-tight">
              Join Party
            </h3>
            <p className="text-[#8885a0] text-center text-xs sm:text-sm mb-6 sm:mb-8 font-medium">
              Enter the 6-character room code to sync up.
            </p>

            <input
              type="text"
              maxLength={6}
              value={roomId}
              onChange={(e) => {
                setRoomId(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                );
                setError("");
              }}
              placeholder="000000"
              className="w-full bg-[#05050a] border border-white/10 rounded-xl py-4 text-center text-3xl sm:text-4xl font-black tracking-[0.25em] text-[#c8102e] focus:border-[#c8102e] focus:ring-4 focus:ring-[#c8102e]/5 outline-none transition-all mb-4 uppercase placeholder:text-slate-900"
            />

            {error && (
              <p className="text-[#ef4444] text-[10px] font-bold uppercase tracking-widest text-center mb-4 animate-pulse">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowJoinPopup(false)}
                className="py-3 font-bold text-xs uppercase tracking-wider text-[#8885a0] hover:text-white transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={joinRoomHandler}
                className="py-3 bg-[#c8102e] hover:bg-[#b00e28] rounded-xl font-black text-xs tracking-wider text-white shadow-lg shadow-[#c8102e]/10 transition-all active:scale-95"
              >
                JOIN NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHOOSE MOVIE POPUP */}
      {showCreatePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b0b14] border border-white/[0.06] rounded-2xl p-5 sm:p-8 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Select Media to Sync
              </h3>
              <button
                type="button"
                onClick={() => setShowCreatePopup(false)}
                className="text-[#8885a0] hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-[#8885a0] text-xs sm:text-sm mb-6 font-medium">
              Choose a movie below to initialize your global watch party room.
            </p>

            {/* Scrollable Content Grid */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
              <div className="border-t border-white/[0.04] pt-4">
                <p className="text-[10px] text-[#8885a0] font-bold uppercase tracking-widest mb-4">
                  Available Collections
                </p>

                {movies.length === 0 ? (
                  <p className="text-center py-12 text-[#8885a0] text-sm font-medium">
                    Your library is empty. Add movies to get started!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {movies.map((movie) => (
                      <div
                        key={movie._id}
                        onClick={() =>
                          createRoomHandler(movie?.movieKey, movie?.movieName)
                        }
                        className="group flex items-center gap-3.5 p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-[#c8102e]/30 hover:bg-white/[0.03] transition-all cursor-pointer"
                      >
                        <div className="w-12 h-16 bg-[#05050a] rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                          <img
                            src="https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400"
                            className="w-full h-full object-cover opacity-30 group-hover:opacity-60 transition-opacity"
                            alt={movie.movieName}
                          />
                        </div>
                        <div className="overflow-hidden flex-1 flex flex-col justify-center">
                          <h4 className="font-bold text-white text-sm truncate group-hover:text-[#c8102e] transition-colors tracking-tight">
                            {movie.movieName}
                          </h4>
                          <p className="text-[10px] text-[#8885a0] font-medium truncate mt-0.5">
                            By {movie.uploader?.username}
                          </p>
                          <span className="self-start mt-2 text-[8px] font-black tracking-widest bg-[#c8102e]/10 text-[#ef4444] px-1.5 py-0.5 rounded uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                            SELECT
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 md:gap-4 px-4 py-3 md:py-3.5 rounded-xl transition-all font-bold text-xs tracking-wider group ${
      active
        ? "bg-[#c8102e] text-white shadow-md shadow-[#c8102e]/10 active:scale-95"
        : "text-[#8885a0] hover:text-white hover:bg-white/[0.02] active:scale-95"
    }`}
  >
    <div className={active ? "text-white" : "group-hover:text-[#c8102e] transition-colors"}>
      {icon}
    </div>
    <span className="hidden lg:block uppercase tracking-widest text-[11px] font-black">
      {label}
    </span>
  </button>
);

export default Main;