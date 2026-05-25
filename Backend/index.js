const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT || 3300;

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const connect_to_db = require("./DB/db");
const userRouter = require("./Routes/User");
const roomRouter = require("./Routes/Room");

const passport = require("passport");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");


const { joinRoom, leaveRoom, togglePlay, videoTimeStamp, requestSync } = require("./sockets/room.socket");
const Room = require("./Model/room.model");
const movieRouter = require("./Routes/Movie");

const app = express();
const httpServer = http.createServer(app);
app.use(cookieParser());

const io = new Server(httpServer, {
  cors: {
    origin: "https://watch-party-frontend-ovmj.onrender.com",
    credentials: true,
  }
});

// Middlewares
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());
app.use(cors({ origin: "https://watch-party-frontend-ovmj.onrender.com", credentials: true }));
app.use(morgan("dev"));
app.use(passport.initialize());

require("./Passport/Passport");

// Routes
app.get("/health", (req, res) => {
  res.send("Server is Working");
});
app.use("/auth", userRouter);
app.use("/room", roomRouter);
app.use("/movie", movieRouter);


// Socket events

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("join-room", (data) => joinRoom(io, socket, data));
  socket.on("leave-room", (data) => leaveRoom(io, socket, data));
  socket.on("toggle-play", (data) => togglePlay(io, socket, data));
  socket.on("time-stamp", (data) => videoTimeStamp(io, socket, data));
  socket.on("request-sync", (data) => requestSync(io, socket, data));


  socket.on("webrtc-join-call", ({ roomId, userId, username }) => {
    // Tell everyone else in the room that this socket joined the call
    socket.to(roomId).emit("webrtc-user-joined", {
      socketId: socket.id,
      userId,
      username,
    });
  });

  socket.on("webrtc-offer", ({ to, offer }) => {
    // Relay offer to a specific socket
    io.to(to).emit("webrtc-offer", {
      from: socket.id,
      offer,
    });
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    // Relay answer to a specific socket
    io.to(to).emit("webrtc-answer", {
      from: socket.id,
      answer,
    });
  });

  socket.on("webrtc-ice", ({ to, candidate }) => {
    // Relay ICE candidate to a specific socket
    io.to(to).emit("webrtc-ice", {
      from: socket.id,
      candidate,
    });
  });

  socket.on("webrtc-leave-call", ({ roomId }) => {
    // Tell everyone in the room this socket left the call
    socket.to(roomId).emit("webrtc-user-left", {
      socketId: socket.id,
    });
  });


  socket.on("disconnect", async () => {
    if (!socket.roomId) return;
    const room = await Room.findOne({ roomCode: socket.roomId });
    leaveRoom(io, socket, room?.hostId);
    socket.rooms.forEach((roomId) => {
      socket.to(roomId).emit("webrtc-user-left", { socketId: socket.id });
    });
  });
});
// Server Connection
connect_to_db().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
});