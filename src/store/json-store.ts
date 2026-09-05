import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSeedDb } from "../data/seed.js";
import type { Database } from "../types/database.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const defaultPath = resolve(root, "data/db.json");
const seedPath = resolve(root, "data/db.seed.json");

let db: Database;
let persistQueue: Promise<void> = Promise.resolve();

function dataPath() {
  return resolve(process.env.DATA_PATH ? resolve(root, process.env.DATA_PATH) : defaultPath);
}

function writeAtomic(path: string, payload: Database) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(payload, null, 2));
  renameSync(tmp, path);
}

export function loadStore() {
  const path = dataPath();
  mkdirSync(dirname(path), { recursive: true });
  if (!existsSync(seedPath)) {
    writeAtomic(seedPath, createSeedDb());
  }
  if (!existsSync(path)) {
    copyFileSync(seedPath, path);
  }
  db = JSON.parse(readFileSync(path, "utf8")) as Database;
}

export function resetStore() {
  const seeded = createSeedDb();
  writeAtomic(seedPath, seeded);
  writeAtomic(dataPath(), seeded);
  db = JSON.parse(JSON.stringify(seeded)) as Database;
  return db;
}

export function getDb(): Database {
  if (!db) loadStore();
  return db;
}

export function mutate<T>(fn: (database: Database) => T): T {
  const database = getDb();
  const result = fn(database);
  persistQueue = persistQueue.then(() => {
    writeAtomic(dataPath(), database);
  });
  return result;
}

export async function flush() {
  await persistQueue;
}
