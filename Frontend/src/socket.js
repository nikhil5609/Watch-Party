import { io } from "socket.io-client";

const SOCKET_URL = "https://watch-party-backend-ry0f.onrender.com";

// FIX: was ["polling"] only — disables WebSocket, increases latency
// especially bad for upcoming WebRTC signaling (audio call)
export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: false,
});