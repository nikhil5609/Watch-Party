const Room = require("../Model/room.model");

const roomUsers = {};
const roomDeleteTimers = {};
const timeStamps = {};
const status = {};
const joinRoom = (io, socket, { roomId, userId }) => {
  socket.join(roomId);

  socket.roomId = roomId;
  socket.userId = userId;

  if (!roomUsers[roomId]) {
    roomUsers[roomId] = [];
  }

  const alreadyJoined = roomUsers[roomId].some(
    (u) => u.userId === userId
  );

  if (!alreadyJoined) {
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


const leaveRoom = async (io, socket) => {
  const { roomId, userId } = socket;

  if (!roomId) return;

  socket.leave(roomId);

  if (!roomUsers[roomId]) return;

  roomUsers[roomId] = roomUsers[roomId].filter(
    (u) => u.socketId !== socket.id
  );

  await Room.updateOne(
    { roomCode: roomId },
    { $pull: { members: { userId: userId } } }
  );

  const updatedRoom = await Room.findOne(
    { roomCode: roomId },
    { members: 1, hostId: 1 }
  ).populate(
    "members.userId",
    "_id username profilePicture"
  );

  if (userId.toString() === updatedRoom?.hostId.toString()) {
      console.log(updatedRoom.members.length);
      
    if (updatedRoom.members.length === 0) {
      await Room.deleteOne({ roomCode: roomId });
      return;
    }

    const newHost = updatedRoom.members[0].userId;

    await Room.updateOne(
      { roomCode: roomId },
      { $set: { hostId: newHost } }
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

const togglePlay = (io, socket, data) => {
  const roomId = socket.roomId
  if (!status[roomId]) {
    status[roomId] = data;
  }
  status[roomId] = data;
  socket.broadcast.to(roomId).emit("control", data);
}

const videoTimeStamp = (io, socket, { roomId, time }) => {
  if (!roomId) return;
  if (!timeStamps[roomId]) {
    timeStamps[roomId] = 0;
  }
  timeStamps[roomId] = time;
  socket.broadcast.to(roomId).emit("get-time", { status: status[roomId], time: timeStamps[roomId] });
}
module.exports = { joinRoom, roomUsers, leaveRoom, togglePlay, videoTimeStamp };
