import Theater from "./Theater";
import Room from "./Room";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { socket } from "../../socket";
import { useNavigate } from "react-router-dom";
import { joinRoom, setRoom } from "../../Store/room.slice";
import useUnloadWarning from "../../Hooks/useUnloadWarning";
import { useGetLiveUser } from "../../Hooks/getLiveUser";
import useAudioCall from "../../Hooks/useAudioCall"

const RoomController = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [checkingRoom, setCheckingRoom] = useState(true);
  const { room } = useSelector((state) => state.room);
  const { user } = useSelector((state) => state.user);
  const joinedRef = useRef(false);
  const hasVideo = room?.video;
  const isReady = room?.status === "ready" || room?.status === "playing";

  useAudioCall(room?.roomCode, user?._id)
  useUnloadWarning(hasVideo && isReady);
  const onlineMembers = useGetLiveUser();

  // Complete Room code here
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
  // Handle room update
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


  if (room?.status === "playing") {
    return <Theater member={onlineMembers} checkingRoom={checkingRoom} />;
  }

  return <Room member={onlineMembers} checkingRoom={checkingRoom} />;
};

export default RoomController;
