import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearRoomState, play, setFile, setVideoState, verifyFile } from "../../Store/room.slice";
import {
  ShieldCheck,
  Film,
  CheckCircle2,
  MonitorUp,
  Users,
  Info,
  LogOut,
  Copy,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import Loading from "../Loading/Loading";
import { socket } from "../../socket";
import getFileHash from "../../Utility/hashFile";

const Room = ({ member, checkingRoom }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.user);
  const { room } = useSelector((state) => state.room);
  
  const [copied, setCopied] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [mutedMembers, setMutedMembers] = useState([]); // Array of user IDs you have muted locally

  if (checkingRoom || !room) return <Loading />;

  /* ---------------- STATE HELPERS ---------------- */
  const isHost = user?._id === room.hostId;
  const myMember = room.members.find((m) => m?.userId?._id === user?._id);

  const hostHasSelectedVideo = Boolean(room.video);
  const iAmVerified = myMember?.fileVerified;

  const allVerified =
    room.members.length > 0 &&
    room.members.every((m) => m.fileVerified === true);

  const canSelectFile =
    (isHost && !hostHasSelectedVideo) ||
    (!isHost && hostHasSelectedVideo && !iAmVerified);

  const canHostChangeVideo =
    isHost && hostHasSelectedVideo && room.status !== "playing";

  /* ---------------- UI TEXT ---------------- */
  const title = isHost
    ? hostHasSelectedVideo
      ? allVerified
        ? "EVERYONE IS READY"
        : "WAITING FOR FRIENDS"
      : "SETUP THE CINEMA"
    : hostHasSelectedVideo
      ? iAmVerified
        ? "WAITING FOR HOST"
        : "VERIFY YOUR MOVIE FILE"
      : "WAITING FOR HOST";

  const subtitle = isHost
    ? hostHasSelectedVideo
      ? allVerified
        ? "You can start the watch party or change the video."
        : "Friends are verifying the movie file. You can still change it."
      : "Select a local movie file to begin."
    : hostHasSelectedVideo
      ? iAmVerified
        ? "Sit tight, the host will start the movie."
        : "Select the same movie file as the host."
      : "The host has not selected a movie yet.";

  /* ---------------- ACTIONS ---------------- */
  const handleCopyId = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    if (!window.confirm("Are you sure?")) return;
    socket.emit("leave-room", room?.hostId);
    socket.disconnect();
    navigate("/");
    dispatch(clearRoomState());
    localStorage.removeItem("roomId");
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    dispatch(setVideoState(objectUrl));
    const hash = await getFileHash(file);
    const size = (file.size / (1024 * 1024)).toFixed(2);

    if (isHost) {
      dispatch(
        setFile({
          roomId: room.roomCode,
          hash,
          name: file.name,
          size,
        })
      );
    } else {
      dispatch(
        verifyFile({
          roomId: room.roomCode,
          hash,
        })
      );
    }
    e.target.value = "";
  };

  const handleStartTheater = () => {
    if (!isHost || !allVerified) return;
    dispatch(play({ roomId: room?.roomCode }));
  };

  // Toggle my own microphone
  const toggleMyMic = () => {
    setIsMicEnabled(!isMicEnabled);
    // Logic for socket.emit('mute-status', !isMicEnabled) would go here
  };

  // Toggle muting a specific friend locally
  const toggleMuteFriend = (memberId) => {
    setMutedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col lg:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full lg:w-80 bg-slate-900/50 p-6 flex flex-col border-r border-white/5">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
            Invite Code
          </p>

          <div
            onClick={handleCopyId}
            className="group flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-xl cursor-pointer hover:bg-white/10"
          >
            <code className="text-red-500 font-mono font-bold tracking-wider">
              {room.roomCode}
            </code>
            {copied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} className="text-slate-400 group-hover:text-white" />
            )}
          </div>

          <div className="mt-8">
             <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3">
              Your Audio
            </p>
            <button
              onClick={toggleMyMic}
              className={`flex items-center justify-between w-full p-3 rounded-xl border transition-all ${
                isMicEnabled 
                ? "bg-red-500/10 border-red-500/40 text-red-500" 
                : "bg-white/5 border-white/10 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-3">
                {isMicEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                <span className="text-xs font-bold uppercase tracking-widest">
                  {isMicEnabled ? "Mic On" : "Mic Muted"}
                </span>
              </div>
              {isMicEnabled && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </button>
          </div>

          <h2 className="flex items-center gap-2 mt-8 mb-6 font-black text-sm tracking-widest">
            <Users size={18} /> PARTY ({room.members.length})
          </h2>

          <div className="space-y-4">
            {member.map((p) => {
              const isMe = p.userId._id === user?._id;
              const isFriendMuted = mutedMembers.includes(p.userId._id);

              return (
                <div key={p.userId._id} className="flex items-center gap-4 group">
                  <div className="relative">
                    <img
                      src={p.userId.profilePicture}
                      alt=""
                      className="w-10 h-10 rounded-md object-cover border border-white/10"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate max-w-[80px]">
                        {p.userId.username}
                      </span>
                      {p.userId._id === room.hostId && (
                        <ShieldCheck size={14} className="text-red-500" />
                      )}
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">
                      {p.fileVerified ? "Ready" : "Waiting"}
                    </p>
                  </div>

                  {/* VOICE CONTROLS FOR OTHERS */}
                  <div className="flex items-center gap-2">
                    {!isMe && (
                      <button 
                        onClick={() => toggleMuteFriend(p.userId._id)}
                        className={`p-2 rounded-lg transition-all ${
                          isFriendMuted 
                          ? "bg-red-500/20 text-red-500" 
                          : "text-slate-500 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {isFriendMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                    )}
                    
                    {p.fileVerified && (
                      <CheckCircle2 size={18} className="text-green-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-xs text-slate-400 flex gap-2 bg-slate-800/30 p-3 rounded-lg">
            <Info size={14} />
            Everyone must select the same local movie file.
          </div>
        </div>

        <button
          onClick={handleLeaveRoom}
          className="mt-6 flex items-center justify-center gap-2 w-full py-3 px-4
                     bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white
                     transition-all rounded-xl font-bold text-sm tracking-widest"
        >
          <LogOut size={18} /> LEAVE ROOM
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <Film size={64} className="text-red-600 mb-6" />
        <h1 className="text-4xl font-black">{title}</h1>
        <p className="text-slate-400 mt-3 mb-10 max-w-md">
          {subtitle}
        </p>

        <label
          className={`w-full max-w-md h-44 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4
          ${canSelectFile
              ? "border-white/20 hover:border-red-500 hover:bg-red-500/5 cursor-pointer"
              : "opacity-30 cursor-not-allowed border-white/10"
            }`}
        >
          <MonitorUp size={32} />
          <span className="text-sm font-medium">
            {canSelectFile ? "Click to browse files" : room?.video?.name || "No file selected"}
          </span>
          <input
            type="file"
            hidden
            accept="video/*"
            disabled={!canSelectFile}
            onChange={handleFileSelect}
          />
        </label>

        {canHostChangeVideo && (
          <>
            <button
              onClick={() =>
                document.getElementById("change-video-input").click()
              }
              className="mt-4 w-full max-w-md py-3 rounded-xl
                         bg-yellow-600/20 text-yellow-400
                         hover:bg-yellow-600 hover:text-white
                         transition-all font-bold tracking-widest"
            >
              CHANGE VIDEO
            </button>

            <input
              id="change-video-input"
              type="file"
              accept="video/*"
              hidden
              onChange={handleFileSelect}
            />
          </>
        )}

        <button
          onClick={handleStartTheater}
          disabled={!isHost || !allVerified}
          className={`mt-8 w-full max-w-md py-5 rounded-2xl font-black tracking-widest
          ${isHost && allVerified
              ? "bg-green-600 shadow-lg shadow-green-600/20"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
        >
          {isHost
            ? allVerified
              ? "READY TO PLAY"
              : "WAITING FOR FRIENDS"
            : iAmVerified
              ? "WAITING FOR HOST"
              : "VERIFY FILE"}
        </button>
      </main>
    </div>
  );
};

export default Room;