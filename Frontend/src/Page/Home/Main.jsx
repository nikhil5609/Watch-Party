import { PlusCircle, Users, LogOut, Play, Settings, Bell, Search, Library } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../Store/user.slice';
import { useNavigate } from 'react-router-dom';
import { createRoom, joinRoom } from '../../Store/room.slice';
import { useEffect, useState } from 'react';

const Main = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {user} = useSelector(state => state.user);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');

  const handleLogout = () => {
    dispatch(logoutUser())
    .then((res) => {
      navigate('/')
    })
  };
  const createRoomHandler = () => {
    dispatch(createRoom())
      .then((res) => {
        if (res.payload?.success || res.payload?.room) {
          localStorage.setItem('roomId',res.payload?.room ?.roomCode);
          navigate('/room');
        }
      })
  }
  const joinRoomHandler = () => {
    const cleanRoomId = roomId.trim();
    if (!/^[A-Z0-9]{6}$/.test(cleanRoomId)) {
      setError('Room ID must be exactly 6 characters (A–Z, 0–9)');
      return;
    }

    dispatch(joinRoom(cleanRoomId)).then((res) => {
      if (res.payload?.success || res.payload?.room) {
        setShowJoinPopup(false);
        localStorage.setItem('roomId',res.payload?.room ?.roomCode);
        navigate('/room');
      } else {
        setError('Invalid Room ID');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row font-sans">

      {/* --- SIDEBAR --- */}
      <aside className="w-full md:w-72 bg-slate-900/40 border-r border-slate-800 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(220,38,38,0.3)]">C</div>
          <span className="text-xl font-bold tracking-tighter">CINE<span className="text-red-600">SYNC</span></span>
        </div>

        <nav className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Activity</p>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm">
            <Play size={18} /> Browse Movies
          </button>

          {/* SIDEBAR LIBRARY LINK */}
          <button
            onClick={() => navigate('/library')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 text-white rounded-xl border border-white/10 font-bold text-sm"
          >
            <Library size={18} /> My Library
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm">
            <Users size={18} /> Friends List
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <img src={user?.user?.profilePicture} alt="User Avatar" className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate">{user?.user?.username}</span>
              <span className="text-[10px] text-green-500 font-medium">● Online</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all text-sm font-medium"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col">

        <header className="px-8 py-6 flex justify-between items-center bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="relative group max-w-md w-full hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search movies or rooms..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2.5 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800"><Bell size={20} /></button>
            <button className="p-2.5 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800"><Settings size={20} /></button>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full">

          {/* Welcome Banner */}
          <section className="bg-gradient-to-r from-red-700 to-red-900 rounded-[2.5rem] p-8 md:p-12 mb-12 relative overflow-hidden group shadow-2xl shadow-red-900/20">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black mb-4">What's the <br />plan tonight?</h2>
              <p className="text-red-100/80 max-w-sm mb-8 font-medium">Access your personal collection or sync up with the squad for a watch party.</p>

              <div className="flex flex-wrap gap-4">
                {/* REDIRECT TO LIBRARY */}
                {/* Welcome Banner Buttons */}
                <div className="flex flex-wrap gap-4">
                  {/* Create Room Button */}
                  <button onClick={() => createRoomHandler()} className="flex items-center gap-2 bg-black/30 backdrop-blur-md text-white border border-white/20 px-8 py-3.5 rounded-2xl font-black text-sm transition-all hover:bg-black/50">
                    <PlusCircle size={20} /> CREATE ROOM
                  </button>

                  {/* JOIN ROOM BUTTON IS HERE */}
                  <button
                    onClick={() => {
                      setShowJoinPopup(true);
                      setError('');
                      setRoomId('');
                    }}
                    className="flex items-center gap-2 bg-black/30 backdrop-blur-md text-white border border-white/20 px-8 py-3.5 rounded-2xl font-black text-sm transition-all hover:bg-black/50"
                  >
                    <Users size={20} /> JOIN ROOM
                  </button>

                </div>
              </div>
            </div>
            <div className="absolute right-[-10%] bottom-[-20%] text-[200px] opacity-10 rotate-12 select-none group-hover:rotate-0 transition-transform duration-700">🎬</div>
          </section>

          {/* Activity Grid (Remains the same) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold">Suggested Movies</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="aspect-[2/3] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 group-hover:border-red-600/50 transition-all mb-3">
                      <img src={`https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&v=${i}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                    </div>
                    <p className="text-sm font-bold truncate">Interstellar</p>
                    <p className="text-xs text-slate-500 font-medium">Sci-Fi • 2014</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold mb-6 flex items-center justify-between">Live Rooms</h3>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
                    <p className="text-sm font-bold mb-2">The Dark Knight Party</p>
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-950 text-[10px] flex items-center justify-center font-bold">U1</div>
                      <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-950 text-[10px] flex items-center justify-center font-bold">U2</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      {showJoinPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-[90%] max-w-md shadow-2xl">

            <h2 className="text-2xl font-black mb-2">Join Room</h2>
            <p className="text-sm text-slate-400 mb-6">
              Enter the 6-digit room ID to join the watch party 🎬
            </p>

            <input
              type="text"
              maxLength={6}
              value={roomId}
              onChange={(e) => {
                setRoomId(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                );
                setError('');
              }}
              placeholder="e.g. 3SGF41"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg tracking-widest text-center font-bold outline-none focus:ring-2 focus:ring-red-600"
            />

            {error && (
              <p className="text-red-500 text-sm mt-3 font-medium">{error}</p>
            )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowJoinPopup(false)}
                className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
              >
                Cancel
              </button>

              <button
                onClick={joinRoomHandler}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 font-bold transition-all"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Main;