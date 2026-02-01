const dotenv = require("dotenv");
dotenv.config();

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

const { joinRoom, leaveRoom } = require("./sockets/room.socket");

// ----------------- EXPRESS APP -----------------
const app = express();

// ----------------- HTTP SERVER -----------------
const httpServer = http.createServer(app);

// ----------------- SOCKET.IO -----------------
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// ----------------- MIDDLEWARES -----------------
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(passport.initialize());
require("./Passport/Passport");

// ----------------- ROUTES -----------------
app.get("/health", (req, res) => {
  res.send("Server is Working");
});
app.use("/auth", userRouter);
app.use("/room", roomRouter);

// ----------------- SOCKET EVENTS -----------------
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", (data) => joinRoom(io, socket, data));
  socket.on("leave-room", (data) => leaveRoom(io, socket, data));

  socket.on("disconnect", () => {
    leaveRoom(io, socket, {});
  });
});

// ----------------- START SERVER -----------------
connect_to_db()
  .then(() => {
    console.log("DB CONNECTED SUCCESSFULLY");
    httpServer.listen(3300, () => {
      console.log("Your server is running on Port 3300");
    });
  })
  .catch((err) => {
    console.log("Something went wrong in db connection", err);
  });
