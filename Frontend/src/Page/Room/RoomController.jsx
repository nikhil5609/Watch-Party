import Theater from "./Theater";
import Room from "./Room";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { socket } from "../../socket";
import { useLocation, useNavigate } from "react-router-dom";
import { clearRoomState, joinRoom, setRoom } from "../../Store/room.slice";
import useUnloadWarning from "../../Hooks/useUnloadWarning";

const RoomController = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [presentUser, setPresentUser] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [checkingRoom, setCheckingRoom] = useState(true);
  const { room } = useSelector((state) => state.room);
  const { user } = useSelector((state) => state.user);
  const location = useLocation();

  const joinedRef = useRef(false);

  const hasVideo = room?.video;
  const isReady = room?.status === "ready" || room?.status === "playing";

  useUnloadWarning(hasVideo && isReady);

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

  useEffect(() => {
    const isRoomContext =
      location.pathname.startsWith("/room") ||
      location.pathname.startsWith("/theater");

    if (!isRoomContext && joinedRef.current) {
      socket.emit("leave-room", room?.hostId);
      socket.disconnect();
      dispatch(clearRoomState());
      joinedRef.current = false;
    }
    // return () => {  // remove this return from here
    //   socket.disconnect()
    //   dispatch(clearRoomState());
    // };
  }, [location.pathname]);

  useEffect(() => {
    if (!room?.roomCode || !user?._id) return;
    const handleRoomUsers = (data) => {
      setPresentUser(data)
    };
    socket.on("room-users", handleRoomUsers);
    return () => socket.off("room-users", handleRoomUsers);
  }, [room?.roomCode , user?._id]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdated = (updatedRoom) => {
      dispatch(setRoom(updatedRoom));
    };

    socket.on("room-updated", handleRoomUpdated);

    return () => {
      socket.off("room-updated", handleRoomUpdated);
    };
  }, [socket, dispatch]);

  useEffect(() => {
    const restoreRoom = async () => {
      if (!room) {
        const roomId = localStorage.getItem("roomId");
        if (!roomId) {
          navigate("/");
          return;
        }
        await dispatch(joinRoom(roomId))
          .then((res) => {
            if (res.payload.success === false)
              navigate('/');
          })
      }
      setCheckingRoom(false);
    };
    restoreRoom();
  }, [room, dispatch, navigate]);

  useEffect(() => {
    if (!room || !presentUser.length) return;
    const online = room.members.filter((member) =>
      presentUser.some(
        (u) => {
          return String(u.userId) == String(member.userId?._id)
        }
      )
    );
    setOnlineMembers(online);
  }, [presentUser, room]);

  if (room?.status === "playing") {
    return <Theater member={onlineMembers} checkingRoom={checkingRoom} />;
  }

  return <Room member={onlineMembers} checkingRoom={checkingRoom} />;
};

export default RoomController;
