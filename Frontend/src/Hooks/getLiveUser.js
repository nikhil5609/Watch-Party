import { useSelector } from "react-redux";
import { socket } from "../socket";
import { useState, useEffect } from "react";

export const useGetLiveUser = () => {
  const [presentUser, setPresentUser] = useState([]);
  const { room } = useSelector((state) => state.room);

  useEffect(() => {
    const handleRoomUsers = (data) => {
      setPresentUser(data);
    };

    socket.on("room-users", handleRoomUsers);

    return () => {
      socket.off("room-users", handleRoomUsers);
    };
  }, []);

  if (!room || presentUser.length === 0) return [];

  return room.members.filter((member) =>
    presentUser.some(
      (u) => String(u.userId) === String(member.userId?._id)
    )
  );
};