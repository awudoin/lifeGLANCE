import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { config } from "../config.js";
import * as schema from "./schema.js";

const databaseDir: string = path.dirname(config.databaseUrl);
fs.mkdirSync(databaseDir, { recursive: true });
fs.mkdirSync(config.mediaRoot, { recursive: true });

const sqlite = new Database(config.databaseUrl);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, { schema });
