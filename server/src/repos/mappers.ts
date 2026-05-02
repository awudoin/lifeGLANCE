import type { CategoryRow, MediaFileRow, MilestoneRow, SettingRow } from "../db/schema.js";
import type { CategoryDto, MediaFileDto, MilestoneDto, SettingDto } from "../types.js";

export function mapMilestone(row: MilestoneRow): MilestoneDto {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    datePrecision: row.datePrecision,
    direction: row.direction,
    categoryId: row.categoryId,
    color: row.color,
    note: row.note,
    url: row.url,
    recurrence: row.recurrence ?? null,
    recurrenceId: row.recurrenceId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapCategory(row: CategoryRow): CategoryDto {
  return {
    id: row.id,
    label: row.label,
    color: row.color,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapSetting(row: SettingRow): SettingDto {
  return {
    key: row.key,
    value: row.value,
    updatedAt: row.updatedAt,
  };
}

export function mapMediaFile(row: MediaFileRow): MediaFileDto {
  return {
    id: row.id,
    milestoneId: row.milestoneId,
    kind: row.kind,
    originalName: row.originalName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    storagePath: row.storagePath,
    sha256: row.sha256,
    createdAt: row.createdAt,
  };
}
