import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, ArrowLeft, Film, Play, Trash2, Upload, X, FileVideo, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../../Store/room.slice';
import { axiosClient } from '../../Api/api';
import { useDispatch } from 'react-redux';

const Library = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [movies, setMovies] = useState([]);
  
  // Upload State
  const [movieTitle, setMovieTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/movie/get-movies');
      setMovies(res.data.movies || []);
    } catch (err) {
      console.error("Failed to fetch movies", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Upload
  const handleUpload = async () => {
    if (!selectedFile || !movieTitle) return;

    const formData = new FormData();
    formData.append('movieName', movieTitle);
    formData.append('video', selectedFile); // Ensure key matches your backend expectations

    try {
      setUploading(true);
      await axiosClient.post('/movie/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setMovieTitle('');
      setSelectedFile(null);
      setShowAddForm(false);
      fetchMovies();
    } catch (err) {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
    } else {
      alert("Please select a valid video file.");
    }
  };

  const createRoomHandler = (url) => {
    dispatch(createRoom(url)).then((res) => {
      if (res.payload?.success || res.payload?.room) {
        localStorage.setItem('roomId', res.payload?.room?.roomCode);
        navigate('/room', { state: { movie: url } });
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans">
      <header className="px-6 py-6 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Media Library</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">CineSync Shared Collection</p>
            </div>
          </div>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all"
          >
            {showAddForm ? 'CLOSE' : <><Plus size={18} /> ADD MOVIE</>}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        
        {/* --- UPLOAD FORM --- */}
        {showAddForm && (
          <section className="mb-12 animate-in slide-in-from-top duration-500">
            <div className="bg-gradient-to-br from-slate-900 to-black border border-white/10 rounded-[2.5rem] p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl font-black text-white">Upload to <span className="text-red-600">Cloud.</span></h2>
                  
                  <input 
                    type="text" 
                    value={movieTitle}
                    onChange={(e) => setMovieTitle(e.target.value)}
                    placeholder="Movie Title..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-red-600 text-white"
                  />

                  <div 
                    onClick={() => !selectedFile && fileInputRef.current.click()}
                    className={`w-full h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${selectedFile ? 'border-red-600/50 bg-red-600/5' : 'border-white/10 hover:border-red-600/50'}`}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <FileVideo className="text-red-500 mb-2" size={32} />
                        <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="text-[10px] text-red-500 mt-2 underline">Remove</button>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-slate-400" />
                        <p className="text-xs font-bold text-slate-500">Select Video File</p>
                      </>
                    )}
                  </div>

                  <button 
                    onClick={handleUpload}
                    disabled={!selectedFile || !movieTitle || uploading}
                    className="w-full bg-white disabled:bg-slate-800 text-black py-4 rounded-2xl font-black text-sm tracking-widest flex justify-center items-center gap-2"
                  >
                    {uploading ? <><Loader2 className="animate-spin" size={18} /> UPLOADING...</> : 'SAVE TO LIBRARY'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- DYNAMIC GRID --- */}
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-xl font-black text-white">All Media ({movies.length})</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-red-600" size={48} />
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {movies.map((movie) => (
               <MovieCard key={movie._id} createRoomHandler={createRoomHandler}  movie={movie} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

const MovieCard = ({ movie , createRoomHandler }) => (
  <div className="group flex flex-col">
    <div className="aspect-[2/3] bg-slate-900 rounded-[2rem] overflow-hidden border border-white/5 relative shadow-2xl group-hover:border-red-600/40 transition-all">
      <img 
        src={`https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400`} 
        alt={movie.movieName}
        className="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 gap-3">
          <button 
            onClick={() => createRoomHandler(movie.movieUrl)}
            className="bg-red-600 text-white w-full py-3 rounded-xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-red-700"
          >
             <Play size={14} fill="currentColor" /> WATCH NOW
          </button>
      </div>
    </div>
    <div className="mt-5 px-2">
      <h3 className="font-bold text-white truncate text-base group-hover:text-red-500 transition-colors tracking-tight">
        {movie.movieName}
      </h3>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
        Uploaded by {movie.uploader?.username || 'System'}
      </p>
    </div>
  </div>
);

export default Library;