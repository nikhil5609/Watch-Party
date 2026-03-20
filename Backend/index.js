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

const { ExpressPeerServer } = require("peer");

const { joinRoom, leaveRoom, togglePlay, videoTimeStamp } = require("./sockets/room.socket");
const Room = require("./Model/room.model");

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "https://watch-party-frontend-uro4.onrender.com/",
    credentials: true,
  }
});

const peerServer = ExpressPeerServer(httpServer, {
  debug: true
});

app.use("/peerjs", peerServer);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());
app.use(cors({ origin: "https://watch-party-frontend-uro4.onrender.com/", credentials: true }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(passport.initialize());

require("./Passport/Passport");

app.get("/health", (req, res) => {
  res.send("Server is Working");
});

app.use("/auth", userRouter);
app.use("/room", roomRouter);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", (data) => joinRoom(io, socket, data));
  socket.on("leave-room", (data) => leaveRoom(io, socket, data));
  socket.on("toggle-play", (data) => togglePlay(io, socket, data));
  socket.on("time-stamp", (data) => videoTimeStamp(io, socket, data));

  socket.on("disconnect", async () => {

    if (!socket.roomId) return;

    const room = await Room.findOne({ roomCode: socket.roomId });

    leaveRoom(io, socket, room?.hostId);

  });
});

connect_to_db().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
});
