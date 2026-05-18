import { io } from "socket.io-client";

const SOCKET_URL = "https://watch-party-backend-ry0f.onrender.com";


export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["polling"],
  autoConnect: false,
});