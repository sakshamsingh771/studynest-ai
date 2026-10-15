const { Server } = require("socket.io");
const { verifyAccessToken } = require("../utils/tokens");
const env = require("../config/env");

let io = null;

// Called once from server.js, right after the HTTP server is created.
function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  // Auth happens once, at connection time — the client sends its access token
  // in the handshake. If it's missing/invalid, we reject the connection outright
  // rather than allowing an anonymous socket to sit open.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));
    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    // Every user gets their own room. Broadcasting a notification to "user:<id>"
    // reaches all of that user's open tabs/devices without us tracking socket IDs.
    socket.join(`user:${socket.userId}`);
  });

  console.log("[sockets] Socket.IO initialized");
  return io;
}

// Used by any service (notifications, community, marketplace) to push an
// event to a specific user in real time. Silently no-ops if that user isn't
// currently connected — the Notification document in Mongo is still the
// source of truth; this is just the "push it now if they're online" layer.
function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSockets, emitToUser };
