import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { mediaFiles } from "../db/schema.js";
import type { MediaFileDto } from "../types.js";
import { mapMediaFile } from "./mappers.js";

export interface CreateMediaRecordInput {
  id: string;
  milestoneId: string;
  kind: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  sha256: string;
}

export async function createMediaRecord(input: CreateMediaRecordInput): Promise<MediaFileDto> {
  const createdAt: string = new Date().toISOString();

  await db.insert(mediaFiles).values({
    id: input.id,
    milestoneId: input.milestoneId,
    kind: input.kind,
    originalName: input.originalName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    storagePath: input.storagePath,
    sha256: input.sha256,
    createdAt,
  });

  const row = await db.query.mediaFiles.findFirst({ where: eq(mediaFiles.id, input.id) });
  if (!row) {
    throw new Error("Failed to create media record.");
  }

  return mapMediaFile(row);
}

export async function findMediaRecord(id: string): Promise<MediaFileDto | null> {
  const row = await db.query.mediaFiles.findFirst({ where: eq(mediaFiles.id, id) });
  return row ? mapMediaFile(row) : null;
}

export async function deleteMediaRecord(id: string): Promise<MediaFileDto | null> {
  const deleted = await db.delete(mediaFiles).where(eq(mediaFiles.id, id)).returning();
  const row = deleted[0];
  return row ? mapMediaFile(row) : null;
}
