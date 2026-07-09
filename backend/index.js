import { createApp } from "./src/app.js";
import { env } from "./src/config/env.js";

const { server, store } = createApp();

server.listen(env.port, async () => {
  await store.ensureDb();
  console.log(`QuizHub API listening on http://localhost:${env.port}`);
});
