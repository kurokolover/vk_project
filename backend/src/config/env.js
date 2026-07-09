import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../..");

export const env = {
  port: Number(process.env.PORT || 3001),
  authSecret: process.env.AUTH_SECRET || "dev-secret-change-me",
  dataDir: process.env.DATA_DIR || path.join(projectRoot, "backend", "data"),
  defaultDbPath: path.join(projectRoot, "config", "default-db.json"),
  clientDist: process.env.CLIENT_DIST || path.join(projectRoot, "dist")
};
