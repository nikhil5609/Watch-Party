const Room = require("../Model/room.model");

const roomUsers = {};
const roomDeleteTimers = {};
const timeStamps = {};
const status = {};

/* ================= JOIN ROOM ================= */

const joinRoom = (io, socket, { roomId, userId, peerId }) => {

  socket.join(roomId);

  socket.roomId = roomId;
  socket.userId = userId;
  socket.peerId = peerId;

  if (!roomUsers[roomId]) {
    roomUsers[roomId] = [];
  }

  const existingUser = roomUsers[roomId].find(
    (u) => String(u.userId) === String(userId)
  );

  if (existingUser) {
    existingUser.socketId = socket.id;
    existingUser.peerId = peerId;
  } else {
    roomUsers[roomId].push({
      socketId: socket.id,
      userId,
      peerId,
      joinedAt: Date.now()
    });
  }

  // send existing peers to new user (for WebRTC)
  const existingPeers = roomUsers[roomId]
    .filter((u) => u.socketId !== socket.id)
    .map((u) => u.peerId);

  socket.emit("existing-peers", existingPeers);

  // notify others
  socket.to(roomId).emit("user-joined", {
    userId,
    socketId: socket.id,
    peerId
  });

  // cancel room deletion timer
  if (roomDeleteTimers[roomId]) {
    clearTimeout(roomDeleteTimers[roomId]);
    delete roomDeleteTimers[roomId];
  }

  io.to(roomId).emit("room-users", roomUsers[roomId]);
};


/* ================= LEAVE ROOM ================= */

const leaveRoom = async (io, socket, currentHostId) => {

  const { roomId, userId, peerId } = socket;

  if (!roomId) return;

  socket.leave(roomId);

  if (!roomUsers[roomId]) return;

  // remove user
  roomUsers[roomId] = roomUsers[roomId].filter(
    (u) => u.socketId !== socket.id
  );

  /* ===== HOST REASSIGNMENT ===== */

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
    peerId
  });

  io.to(roomId).emit("room-users", roomUsers[roomId]);

  /* ===== ROOM DELETE TIMER ===== */

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
  socket.peerId = null;
};


/* ================= PLAY / PAUSE ================= */

const togglePlay = (io, socket, data) => {

  const roomId = socket.roomId;

  if (!roomId) return;

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
  leaveRoom,
  togglePlay,
  videoTimeStamp,
  roomUsers,
};