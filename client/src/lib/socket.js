import { io } from "socket.io-client";

const SOCKET_URL = rawUrl().startsWith("http") ? rawUrl().replace(/\/api$/, "") : undefined;

function rawUrl() {
  return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
}

let socket = null;

// Called once the access token is known (after login, signup, or a silent
// refresh on page load). Passing the token in the handshake `auth` field is
// what the server's sockets/index.js middleware verifies.
// SOCKET_URL is undefined when VITE_API_URL is a relative path like "/api"
// (the production Docker/Nginx setup) — socket.io-client then connects to
// the current page's origin automatically, which Nginx proxies to the API.
export function connectSocket(token) {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}
