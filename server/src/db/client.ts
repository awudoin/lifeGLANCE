import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

function hasSchema(): boolean {
  const row = sqlite
    .prepare("select name from sqlite_master where type = 'table' and name = ?")
    .get("milestones") as { name: string } | undefined;

  return Boolean(row);
}

function initializeSchema(): void {
  if (hasSchema()) {
    return;
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const migrationPath = path.resolve(moduleDir, "../../drizzle/0000_initial.sql");
  const migrationSql = fs.readFileSync(migrationPath, "utf8");

  sqlite.exec(migrationSql);
  console.log(`Initialized SQLite schema from ${migrationPath}`);
}

initializeSchema();

export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, { schema });
