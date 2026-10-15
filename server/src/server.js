const http = require("http");
const env = require("./config/env");
const connectDB = require("./config/db");
const app = require("./app");
const { initSockets } = require("./sockets");

async function start() {
  await connectDB();

  // We wrap the Express app in a raw http.Server ourselves (instead of
  // app.listen()) because Socket.IO needs to attach to that same server —
  // both HTTP requests and WebSocket upgrades share one port.
  const httpServer = http.createServer(app);
  initSockets(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`[server] StudyNest AI API running on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

start();
