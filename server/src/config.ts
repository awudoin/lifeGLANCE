import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const projectRoot: string = process.cwd();

function resolveStoragePath(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
}

export interface AppConfig {
  readonly port: number;
  readonly corsOrigin: string;
  readonly databaseUrl: string;
  readonly mediaRoot: string;
}

export const config: AppConfig = {
  port: Number.parseInt(process.env.PORT ?? "3001", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  databaseUrl: resolveStoragePath(process.env.DATABASE_URL ?? "./data/app.db"),
  mediaRoot: resolveStoragePath(process.env.MEDIA_ROOT ?? "./data/media"),
};
