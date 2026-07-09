import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export function createJsonStore({ dataDir, defaultDbPath }) {
  const dbPath = path.join(dataDir, "db.json");

  async function readDefaultDb() {
    const raw = await readFile(defaultDbPath, "utf8");
    return JSON.parse(raw);
  }

  async function ensureDb() {
    await mkdir(dataDir, { recursive: true });
    try {
      await readFile(dbPath, "utf8");
    } catch {
      await writeFile(dbPath, JSON.stringify(await readDefaultDb(), null, 2));
    }
  }

  async function read() {
    await ensureDb();
    const raw = await readFile(dbPath, "utf8");
    return JSON.parse(raw || JSON.stringify(await readDefaultDb()));
  }

  async function write(db) {
    await mkdir(dataDir, { recursive: true });
    await writeFile(dbPath, JSON.stringify(db, null, 2));
  }

  return {
    dbPath,
    ensureDb,
    read,
    write
  };
}
