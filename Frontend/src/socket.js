import { io } from "socket.io-client";

const SOCKET_URL = "https://watch-party-backend-d12q.onrender.com";

// export const socket = io(SOCKET_URL, {
//   transports: ["websocket"],
//   autoConnect: false,
// });

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["polling"]
});
