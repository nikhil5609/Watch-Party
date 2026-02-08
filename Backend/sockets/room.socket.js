const Room = require("../Model/room.model");

const roomUsers = {};
const roomDeleteTimers = {};
const timeStamps = {};
const status = {};

/* ================= JOIN ROOM ================= */

const joinRoom = (io, socket, { roomId, userId }) => {
  socket.join(roomId);

  socket.roomId = roomId;
  socket.userId = userId;

  if (!roomUsers[roomId]) {
    roomUsers[roomId] = [];
  }

  const existingUser = roomUsers[roomId].find(
    (u) => String(u.userId) === String(userId)
  ); // here is first change we are using find instead of some

  if (existingUser) {
    existingUser.socketId = socket.id;
  } else {
    roomUsers[roomId].push({
      socketId: socket.id,
      userId,
    });
  }

  socket.to(roomId).emit("user-joined", {
    userId,
    socketId: socket.id,
  });

  if (roomDeleteTimers[roomId]) {
    clearTimeout(roomDeleteTimers[roomId]);
    delete roomDeleteTimers[roomId];
  }

  io.to(roomId).emit("room-users", roomUsers[roomId]);
};


const leaveRoom = async (io, socket, currentHostId) => {
  const { roomId, userId } = socket;

  if (!roomId) return;

  socket.leave(roomId);

  if (!roomUsers[roomId]) return;

  // Remove user from memory
  roomUsers[roomId] = roomUsers[roomId].filter(
    (u) => u.socketId !== socket.id
  );

  if (
    userId.toString() === currentHostId?.toString() &&
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

  socket.to(roomId).emit("user-left", {
    userId,
    socketId: socket.id,
  });

  io.to(roomId).emit("room-users", roomUsers[roomId]);


  if (roomUsers[roomId].length === 0) {
    roomDeleteTimers[roomId] = setTimeout(async () => {
      if (roomUsers[roomId]?.length === 0) {
        await Room.deleteOne({ roomCode: roomId });
        delete roomUsers[roomId];
      }

      delete roomDeleteTimers[roomId];
    }, 10000);
  }

  socket.roomId = null;
  socket.userId = null;
};

/* ================= PLAY / PAUSE ================= */

const togglePlay = (io, socket, data) => {
  const roomId = socket.roomId;

  if (!status[roomId]) {
    status[roomId] = data;
  }

  status[roomId] = data;

  socket.broadcast.to(roomId).emit("control", data);
};

/* ================= VIDEO TIMESTAMP ================= */

const videoTimeStamp = (io, socket, { roomId, time }) => {
  if (!roomId) return;

  if (!timeStamps[roomId]) {
    timeStamps[roomId] = 0;
  }

  timeStamps[roomId] = time;

  socket.broadcast.to(roomId).emit("get-time", {
    status: status[roomId],
    time: timeStamps[roomId],
  });
};

module.exports = {
  joinRoom,
  roomUsers,
  leaveRoom,
  togglePlay,
  videoTimeStamp,
};
