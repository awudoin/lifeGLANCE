import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Express } from "express";
import { config } from "../config.js";
import { createId } from "./ids.js";

export interface StoredUpload {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storagePath: string;
  absolutePath: string;
}

function extensionFor(file: Express.Multer.File): string {
  const ext: string = path.extname(file.originalname).trim();
  return ext.length > 0 ? ext.toLowerCase() : "";
}

export function persistUpload(file: Express.Multer.File): StoredUpload {
  const id: string = createId();
  const hash: string = crypto.createHash("sha256").update(file.buffer).digest("hex");
  const ext: string = extensionFor(file);
  const relativeDir: string = path.join(hash.slice(0, 2), hash.slice(2, 4));
  const relativePath: string = path.join(relativeDir, `${id}${ext}`);
  const absoluteDir: string = path.join(config.mediaRoot, relativeDir);
  const absolutePath: string = path.join(config.mediaRoot, relativePath);

  fs.mkdirSync(absoluteDir, { recursive: true });
  fs.writeFileSync(absolutePath, file.buffer);

  return {
    id,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    sha256: hash,
    storagePath: relativePath,
    absolutePath,
  };
}

export function resolveMediaAbsolutePath(storagePath: string): string {
  return path.join(config.mediaRoot, storagePath);
}
