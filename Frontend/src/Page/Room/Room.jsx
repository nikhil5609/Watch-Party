import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { joinRoom, setFile, setVideoState, verifyFile } from "../../Store/room.slice";
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
} from "lucide-react";
import Loading from "../Loading/Loading";
import { socket } from "../../socket";
import getFileHash from "../../Utility/hashFile";

const Room = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.user);
  const { room } = useSelector((state) => state.room);

  const [presentUser, setPresentUser] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [checkingRoom, setCheckingRoom] = useState(true);
  const [copied, setCopied] = useState(false);

  /* ---------------- RESTORE ROOM ---------------- */
  useEffect(() => {
    const restoreRoom = async () => {
      if (!room) {
        const roomId = localStorage.getItem("roomId");
        if (!roomId) {
          navigate("/");
          return;
        }
        await dispatch(joinRoom(roomId))
        .then((res)=>{
          if(res.payload.success === false)
          navigate('/');
        })
      }
      setCheckingRoom(false);
    };
    restoreRoom();
  }, [room, dispatch, navigate]);

  /* ---------------- SOCKET PRESENCE ---------------- */
  useEffect(() => {
    if (!room?.roomCode || !user?._id) return;

    const handleRoomUsers = (data) => setPresentUser(data);

    socket.on("room-users", handleRoomUsers);
    socket.emit("join-room", {
      roomId: room.roomCode,
      userId: user._id,
    });

    return () => {
      socket.emit("leave-room", {
        roomId: room.roomCode,
        userId: user._id,
      });
      socket.off("room-users", handleRoomUsers);
    };
  }, [room?.roomCode, user?._id]);

  /* ---------------- ONLINE MEMBERS ---------------- */
  useEffect(() => {
    if (!room || !presentUser.length) return;

    const online = room.members.filter(({ userId }) =>
      presentUser.some((u) => u.userId === userId?._id)
    );
    setOnlineMembers(online);
  }, [room, presentUser]);

  if (checkingRoom || !room) return <Loading />;

  /* ---------------- STATE HELPERS ---------------- */
  const isHost = user?._id === room.hostId;
  const myMember = room.members.find(
    (m) => m?.userId?._id === user?._id
  );

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
    socket.emit("leave-room", {
      roomId: room.roomCode,
      userId: user._id,
    });
    localStorage.removeItem("roomId");
    navigate("/");
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    dispatch(setVideoState(objectUrl))
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
    navigate(`/room/${room.roomCode}/theater`);
  };

  /* ---------------- RENDER ---------------- */
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

          <h2 className="flex items-center gap-2 mt-8 mb-6 font-black text-sm tracking-widest">
            <Users size={18} /> PARTY ({room.members.length})
          </h2>

          <div className="space-y-4">
            {onlineMembers.map((p) => (
              <div key={p.userId._id} className="flex items-center gap-4">
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
                    <span className="font-bold text-sm">
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

                {p.fileVerified && (
                  <CheckCircle2 size={18} className="text-green-500" />
                )}
              </div>
            ))}
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
          ${
            canSelectFile
              ? "border-white/20 hover:border-red-500 hover:bg-red-500/5 cursor-pointer"
              : "opacity-30 cursor-not-allowed border-white/10"
          }`}
        >
          <MonitorUp size={32} />
          <span className="text-sm font-medium">
            {canSelectFile ? "Click to browse files" : room?.video?.name}
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
          ${
            isHost && allVerified
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
