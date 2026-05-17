import { PlusCircle, Users, LogOut, Library, Plus, Globe, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../Store/user.slice';
import { useNavigate } from 'react-router-dom';
import { createRoom, joinRoom } from '../../Store/room.slice';
import { useState, useEffect } from 'react';
import { axiosClient } from '../../Api/api';

const Main = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.user);
  
  // UI States
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
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
      const res = await axiosClient.get('/movie/get-movies');
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
      setMovies(prev => prev.filter(m => m._id !== movieId));
    } catch (err) {
      alert("Only the uploader can delete this movie.");
    }
  };

  // --- HANDLERS ---
  const handleLogout = () => {
    dispatch(logoutUser()).then(() => navigate('/'));
  };

  const createRoomHandler = (selectedMovie = null) => {
    dispatch(createRoom()).then((res) => {
      if (res.payload?.success || res.payload?.room) {
        localStorage.setItem('roomId', res.payload?.room?.roomCode);
        navigate('/room', { state: { movie: selectedMovie } });
      }
    });
  };

  const joinRoomHandler = () => {
    const cleanRoomId = roomId.trim();
    if (!/^[A-Z0-9]{6}$/.test(cleanRoomId)) {
      setError('Room ID must be 6 characters');
      return;
    }
    dispatch(joinRoom(cleanRoomId)).then((res) => {
      if (res.payload?.success || res.payload?.room) {
        setShowJoinPopup(false);
        localStorage.setItem('roomId', res.payload?.room?.roomCode);
        navigate('/room');
      } else {
        setError('Invalid Room ID');
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col md:flex-row font-sans selection:bg-red-500/30">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-full md:w-24 lg:w-64 bg-slate-950 border-r border-white/5 p-6 flex flex-col backdrop-blur-2xl">
        <div className="flex items-center gap-3 px-2 mb-12">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(220,38,38,0.3)]">C</div>
          <span className="text-lg font-black tracking-tighter hidden lg:block italic uppercase">Cine<span className="text-red-600">Sync</span></span>
        </div>

        <nav className="flex-1 space-y-4">
          <NavItem icon={<Library size={22}/>} label="Library" active={true} onClick={() => navigate('/library')} />
          <NavItem icon={<PlusCircle size={22}/>} label="Create Room" onClick={() => createRoomHandler()} />
        </nav>

        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 mb-6">
            <img src={user?.profilePicture} className="w-10 h-10 rounded-full border border-white/10 object-cover" alt="pfp" />
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{user?.username}</p>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">● Online</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 transition-colors group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden lg:block text-sm font-bold">Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-white tracking-tight">Welcome back, {user?.username}.</h1>
              <p className="text-slate-500 font-medium">Ready for a watch party? Pick a movie or start a room.</p>
            </div>
            
            <div className="flex gap-4 w-full lg:w-auto">
              <button 
                onClick={() => { setShowJoinPopup(true); setError(''); setRoomId(''); }}
                className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all active:scale-95"
              >
                <Users size={20}/> JOIN ROOM
              </button>
              <button 
                onClick={() => createRoomHandler()}
                className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-red-600 px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95"
              >
                <PlusCircle size={20}/> START PARTY
              </button>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* DYNAMIC LIBRARY GRID */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 rounded-xl text-red-500"><Globe size={22}/></div>
                <div>
                  <h2 className="text-xl font-black text-white">Shared Media Library</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Community Collection</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/library')}
                className="bg-white text-black px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-lg"
              >
                <Plus size={18}/> ADD TO LIBRARY
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40}/></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {movies.map((movie) => (
                  <div key={movie._id} className="group relative">
                    <div className="aspect-[2/3] bg-slate-900 rounded-[2rem] overflow-hidden border border-white/5 group-hover:border-red-600/40 transition-all relative shadow-2xl">
                      <img 
                        src={movie.thumb || `https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400`} 
                        className="w-full h-full object-cover opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                        alt={movie.movieName} 
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-5 pb-8 gap-3">
                        <button 
                          onClick={() => createRoomHandler(movie)}
                          className="w-full py-3.5 bg-red-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl hover:bg-red-700 transition-colors"
                        >
                          PLAY IN ROOM
                        </button>
                        <div className="flex gap-2 w-full">
                          <button 
                            onClick={() => window.open(movie.movieUrl, '_blank')}
                            className="flex-1 py-2.5 bg-white/10 backdrop-blur-md text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                          >
                            <ExternalLink size={16}/>
                          </button>
                          {user?._id === movie.uploader?._id && (
                            <button 
                              onClick={() => deleteMovie(movie._id)}
                              className="flex-1 py-2.5 bg-red-500/10 backdrop-blur-md text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 size={16}/>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 px-3">
                      <h4 className="font-bold text-white text-sm truncate group-hover:text-red-500 transition-colors tracking-tight">{movie.movieName}</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mt-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> 
                        {user?._id === movie.uploader?._id ? 'Added by you' : `By ${movie.uploader?.username}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* JOIN ROOM POPUP - (Remains same as your code) */}
      {showJoinPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg p-6">
          <div className="bg-[#0f172a] border border-white/10 rounded-[3rem] p-10 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300">
            <h3 className="text-3xl font-black text-white mb-2 text-center">Join Party</h3>
            <p className="text-slate-400 text-center text-sm mb-8 font-medium">Enter the 6-character room code to sync up.</p>
            
            <input 
              type="text" 
              maxLength={6} 
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                setError('');
              }}
              placeholder="000000"
              className="w-full bg-black border border-white/10 rounded-[1.5rem] py-5 text-center text-4xl font-black tracking-[0.3em] text-red-600 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/10 transition-all mb-4 uppercase placeholder:text-slate-800"
            />

            {error && (
              <p className="text-red-500 text-xs font-black uppercase tracking-widest text-center mb-4 animate-pulse">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mt-4">
              <button onClick={() => setShowJoinPopup(false)} className="py-4 font-bold text-slate-500 hover:text-white transition-colors">Go Back</button>
              <button onClick={joinRoomHandler} className="py-4 bg-red-600 rounded-[1.25rem] font-black text-white shadow-xl shadow-red-600/30 hover:bg-red-700 transition-all active:scale-95">JOIN NOW</button>
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
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
      active 
        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 active:scale-95' 
        : 'text-slate-500 hover:text-white hover:bg-white/5 active:scale-95'
    }`}
  >
    <div className={`${active ? 'text-white' : 'group-hover:text-red-500 transition-colors'}`}>
      {icon}
    </div>
    <span className="hidden lg:block text-xs font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default Main;