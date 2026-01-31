import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3300";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
});