import { io } from "socket.io-client";

const socket = io("https://real-time-code-editor-vercodex.onrender.com", {
  withCredentials: true,
  autoConnect: false,
});

export { socket };
