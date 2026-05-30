function registerActiveUsers(io, socket) {
  socket.on("get-active-users", async (roomId, callback) => {
    try {
      if (!roomId) {
        return callback([]);
      }

      const sockets = await io.in(roomId.toString()).fetchSockets();

      const userMap = new Map();

      for (const s of sockets) {
        const user = s.user;

        if (!user) continue;

        const userId = user._id.toString();

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            username: user.username,
          });
        }
      }

      const activeUsers = Array.from(userMap.values());

      callback(activeUsers);
    } catch (error) {
      callback([]);
    }
  });
}

function registerCursor(io, socket) {
  socket.on("cursor-move", (data) => {
    socket.to(data.roomId).emit("cursor-update", {
      userId: socket.user._id,
      username: socket.user.username,

      fileId: data.fileId,

      position: data.position,
      selection: data.selection,
    });
  });
}

import * as Y from "yjs";

const docStateMap = new Map();

function registerCRDTSync(io, socket) {
  socket.on("join-document", (docId, callback) => {
    socket.join(docId);

    if (typeof callback === "function") {
      const existingState = docStateMap.get(docId);
      callback(existingState ? Array.from(existingState) : null);
    }
  });

  socket.on("doc-update", (payload) => {
    const { docId, update } = payload;
    if (!docId || !update) return;

    const updateBytes = new Uint8Array(update);

    // Merge update into persisted doc state
    const ydoc = new Y.Doc();
    const existing = docStateMap.get(docId);
    if (existing) {
      Y.applyUpdate(ydoc, existing);
    }
    Y.applyUpdate(ydoc, updateBytes);
    docStateMap.set(docId, Y.encodeStateAsUpdate(ydoc));
    ydoc.destroy();

    socket.broadcast.to(docId).emit("doc-update", {
      docId,
      update,
      sender: socket.user?._id,
    });
  });

  socket.on("leave-document", (docId) => {
    socket.leave(docId);
  });
}

export { registerActiveUsers, registerCRDTSync, registerCursor };
