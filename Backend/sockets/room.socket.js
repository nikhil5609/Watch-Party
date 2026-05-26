const Room = require("../Model/room.model");

const roomUsers = {};
const status = {};

/* ================= JOIN ROOM ================= */

const joinRoom = async (io, socket, { roomId, userId }) => {

  socket.join(roomId);
  socket.roomId = roomId;
  socket.userId = userId;

  if (!roomUsers[roomId]) {
    roomUsers[roomId] = [];
  }

  roomUsers[roomId].push({
    socketId: socket.id,
    userId,
    joinedAt: Date.now()
  });

  socket.to(roomId).emit("user-joined", {
    userId,
    socketId: socket.id,
  });

  if (status[roomId]) {
    socket.emit("control", status[roomId]);
  }

  io.to(roomId).emit("room-users", roomUsers[roomId]);
};


/* ================= LEAVE ROOM ================= */

const leaveRoom = async (io, socket, currentHostId) => {

  const { roomId, userId } = socket;
  if (!roomId) return;

  socket.leave(roomId);

  if (!roomUsers[roomId]) return;

  roomUsers[roomId] = roomUsers[roomId].filter(
    (u) => u.socketId !== socket.id
  );

  if (
    userId?.toString() === currentHostId?.toString() &&
    roomUsers[roomId].length !== 0
  ) {

    let firstUser = null;

    for (const member of roomUsers[roomId]) {
      if (!firstUser || member.joinedAt < firstUser.joinedAt) {
        firstUser = member;
      }
    }

    const newHost = firstUser?.userId;

    await Room.updateOne(
      { roomCode: roomId },
      { $set: { hostId: newHost } }
    );

    const updatedRoom = await Room.findOne({ roomCode: roomId }).populate(
      "members.userId",
      "_id username profilePicture"
    );

    io.to(roomId).emit("room-updated", updatedRoom);
  }

  // notify users
  socket.to(roomId).emit("user-left", {
    userId,
    socketId: socket.id,
  });

  io.to(roomId).emit("room-users", roomUsers[roomId]);

  /* ===== ROOM DELETE TIMER ===== */

  if (roomUsers[roomId]?.length === 0) {
    await Room.deleteOne({ roomCode: roomId });
    delete roomUsers[roomId];
  }
  socket.roomId = null;
  socket.userId = null;
  socket.peerId = null;
};


/* ================= PLAY / PAUSE + SYNC ================= */

const togglePlay = (io, socket, data) => {

  const roomId = socket.roomId;
  if (!roomId) return;

  status[roomId] = {
    state: data.state,
    current_time: data.current_time
  };

  socket.to(roomId).emit("control", status[roomId]);
};

const videoTimeStamp = (io, socket, data) => {
  if (!data.roomId) return;

  if (!status[data.roomId]) {
    status[data.roomId] = { state: "pause", current_time: 0 }
  }

  status[data.roomId] = { ...status[data.roomId], current_time: data.current_time };

  socket.broadcast.to(data.roomId).emit("get-time", status[data.roomId]);
};

const requestSync = (io, socket, data) => {
  const roomId = socket.roomId;
  if (roomId && status[roomId]) {
    socket.emit("control", status[roomId]);
  }
} 



module.exports = {
  joinRoom,
  leaveRoom,
  togglePlay,
  videoTimeStamp,
  roomUsers,
  requestSync
};