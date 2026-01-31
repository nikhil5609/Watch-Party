const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const server = express();
const connect_to_db = require("./DB/db");
const userRouter = require("./Routes/User");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const roomRouter = require("./Routes/Room");
const { Server } = require("socket.io");
const { createServer } = require('http');
const { joinRoom, leaveRoom } = require("./sockets/room.socket");


// Io server
const app = createServer(server);
const io = new Server(app, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// ----------------- MIDDLEWARES -----------------
server.use(express.json());
server.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
server.use(morgan("dev"));
server.use(cookieParser());
server.use(passport.initialize());
require("./Passport/Passport");

// ----------------- ROUTES -----------------
server.get("/health", (req, res) => {
  res.send("Server is Working");
});
server.use("/auth", userRouter);
server.use('/room', roomRouter);

// ----------------- SERVER START -----------------
io.on("connection", (socket) => {
  socket.on("join-room", (data) => joinRoom(io, socket, data));

  socket.on("leave-room", (data) => leaveRoom(io, socket, data));

  socket.emit("room-update","Room is updated")

  socket.on("disconnect", () => {
    leaveRoom(io, socket, {});
  });
});

connect_to_db()
  .then(() => {
    console.log("DB CONNECTED SUCCESSFULLY");
    app.listen(3300, () => {
      console.log(`Your server is running on Port 3300`);
    });
  })
  .catch((err) => {
    console.log("Something went wrong in db connection", err);
  });
