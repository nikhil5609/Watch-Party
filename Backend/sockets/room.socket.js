const Room = require("../Model/room.model");

const roomUsers = {};
const roomDeleteTimers = {};

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


const leaveRoom = (io, socket) => {
  const { roomId, userId } = socket;

  if (!roomId) return;

  socket.leave(roomId);

  if (!roomUsers[roomId]) return;

  roomUsers[roomId] = roomUsers[roomId].filter(
    (u) => u.socketId !== socket.id
  );

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

    }, 100000);
  }


  socket.roomId = null;
  socket.userId = null;
};


module.exports = { joinRoom, roomUsers, leaveRoom };
