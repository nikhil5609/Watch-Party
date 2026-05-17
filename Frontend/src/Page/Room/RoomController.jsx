import Theater from "./Theater";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { socket } from "../../socket";
import { useNavigate } from "react-router-dom";
import { joinRoom, setRoom } from "../../Store/room.slice";
import { useGetLiveUser } from "../../Hooks/getLiveUser";
import { UserPlus, UserMinus, X } from "lucide-react";

const RoomController = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { room } = useSelector((state) => state.room);
  const { user } = useSelector((state) => state.user);

  const [notifications, setNotifications] = useState([]);

  const joinedRef = useRef(false);
  const membersRef = useRef([]);

  const onlineMembers = useGetLiveUser();

  useEffect(() => {
    membersRef.current = onlineMembers;
  }, [onlineMembers]);

  const addToast = (username, type = "join") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, username, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // Socket Connection & Room Join
  useEffect(() => {
    if (!room?.roomCode || !user?._id) return;
    if (!joinedRef.current) {
      socket.connect();
      socket.emit("join-room", {
        roomId: room.roomCode,
        userId: user._id,
      });
      joinedRef.current = true;
    }
  }, [room?.roomCode, user?._id]);

  // Listen for Users Entering/Exiting
  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = (data) => {
      const userObj = membersRef.current.find(m => m.userId._id === data.userId);
      const userName = userObj?.userId?.username || "New viewer";
      addToast(userName, "join");
    };

    const handleUserLeft = (data) => {
      const userObj = membersRef.current.find(m => m.userId._id === data.userId);
      const userName = userObj?.userId?.username || "A viewer";
      addToast(userName, "left");
    };

    const handleRoomUpdate = (data) => {
      dispatch(setRoom(data));
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("room-updated", handleRoomUpdate);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("room-updated", handleRoomUpdate);
    };
  }, [socket, dispatch]);

  // Restore room from localstorage
  useEffect(() => {
    const restoreRoom = async () => {
      if (!room) {
        const roomId = localStorage.getItem("roomId");
        if (!roomId) {
          navigate("/");
          return;
        }
        const res = await dispatch(joinRoom(roomId));
        if (res.payload?.success === false) navigate('/');
      }
    };
    restoreRoom();
  }, [room, dispatch, navigate]);

  return (
    <>
      <Theater member={onlineMembers} />

      {/* NOTIFICATION STACK */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="flex items-center gap-4 px-4 py-3 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-notification"
          >
            <div className={`p-2 rounded-xl ${n.type === 'join' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {n.type === 'join' ? <UserPlus size={18} /> : <UserMinus size={18} />}
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-none mb-1">
                {n.type === 'join' ? 'Arrival' : 'Departure'}
              </p>
              <p className="text-sm font-medium text-white">
                {n.username} {n.type === 'join' ? 'entered' : 'left'}
              </p>
            </div>
            <button className="ml-2 text-white/20 hover:text-white pointer-events-auto">
              <X size={14} onClick={() => setNotifications(prev => prev.filter(t => t.id !== n.id))} />
            </button>
          </div>
        ))}
      </div>

      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(30px); opacity: 0; scale: 0.95; }
            to { transform: translateX(0); opacity: 1; scale: 1; }
          }
          .animate-slide-in {
            animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}
      </style>
    </>
  );
};

export default RoomController;