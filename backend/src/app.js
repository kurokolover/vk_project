import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { createAuthService } from "./auth/authService.js";
import { env } from "./config/env.js";
import { createJsonStore } from "./data/jsonStore.js";
import { createSessionService } from "./realtime/sessionService.js";
import { registerSocketHandlers } from "./realtime/socketHandlers.js";
import { createAuthRouter } from "./routes/authRoutes.js";
import { createDashboardRouter } from "./routes/dashboardRoutes.js";
import { createQuizRouter } from "./routes/quizRoutes.js";

export function createApp() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  const store = createJsonStore({
    dataDir: env.dataDir,
    defaultDbPath: env.defaultDbPath
  });
  const authService = createAuthService({
    store,
    secret: env.authSecret
  });
  const sessionService = createSessionService({
    store,
    io
  });

  app.use(express.json({ limit: "2mb" }));
  app.use("/api/auth", createAuthRouter({ store, authService }));
  app.use("/api", createDashboardRouter({ store, authService }));
  app.use("/api", createQuizRouter({ store, authService }));
  app.use(express.static(env.clientDist));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(env.clientDist, "index.html"));
  });

  registerSocketHandlers({
    io,
    store,
    authService,
    sessionService
  });

  return {
    app,
    server,
    store
  };
}
