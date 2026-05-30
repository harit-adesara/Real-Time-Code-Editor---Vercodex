import { Server } from "socket.io";
import { verifySocketJWT } from "./verifyJWTSocket.js";
import { Members } from "../models/roomMembers.js";
import {
  registerActiveUsers,
  registerCRDTSync,
  registerCursor,
} from "./event.js";

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(verifySocketJWT);

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();

    socket.join(userId);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
    });

    // ❌ LEAVE ROOM
    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
    });

    registerActiveUsers(io, socket);
    registerCRDTSync(io, socket);
    registerCursor(io, socket);

    socket.on("disconnect", () => {
      console.log("Socket Disconnected");
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};

export { getIO, initSocket };
