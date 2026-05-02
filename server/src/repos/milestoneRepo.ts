import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { mediaFiles, milestones } from "../db/schema.js";
import type { MilestoneDto, RestoreMilestoneBody, UpsertMilestoneBody } from "../types.js";
import { createId } from "../utils/ids.js";
import { mapMilestone } from "./mappers.js";

export async function listMilestones(): Promise<MilestoneDto[]> {
  const rows = await db.select().from(milestones).orderBy(asc(milestones.date), asc(milestones.createdAt));
  return rows.map(mapMilestone);
}

export async function createMilestone(input: UpsertMilestoneBody): Promise<MilestoneDto> {
  const id: string = createId();
  const now: string = new Date().toISOString();

  await db.insert(milestones).values({
    id,
    title: input.title,
    date: input.date,
    datePrecision: input.datePrecision,
    direction: input.direction,
    categoryId: input.categoryId,
    color: input.color,
    note: input.note ?? "",
    url: input.url ?? "",
    recurrence: input.recurrence ?? null,
    recurrenceId: input.recurrenceId ?? null,
    createdAt: now,
    updatedAt: now,
  });

  const row = await db.query.milestones.findFirst({ where: eq(milestones.id, id) });
  if (!row) {
    throw new Error("Failed to create milestone.");
  }

  return mapMilestone(row);
}

export async function updateMilestone(id: string, input: UpsertMilestoneBody): Promise<MilestoneDto | null> {
  const now: string = new Date().toISOString();

  const result = await db
    .update(milestones)
    .set({
      title: input.title,
      date: input.date,
      datePrecision: input.datePrecision,
      direction: input.direction,
      categoryId: input.categoryId,
      color: input.color,
      note: input.note ?? "",
      url: input.url ?? "",
      recurrence: input.recurrence ?? null,
      recurrenceId: input.recurrenceId ?? null,
      updatedAt: now,
    })
    .where(eq(milestones.id, id))
    .returning();

  const row = result[0];
  return row ? mapMilestone(row) : null;
}

export async function deleteMilestoneById(id: string): Promise<boolean> {
  const deleted = await db.delete(milestones).where(eq(milestones.id, id)).returning({ id: milestones.id });
  return deleted.length > 0;
}

export async function deleteMilestonesByRecurrenceId(recurrenceId: string): Promise<number> {
  const deleted = await db
    .delete(milestones)
    .where(eq(milestones.recurrenceId, recurrenceId))
    .returning({ id: milestones.id });

  return deleted.length;
}

export async function replaceAllMilestones(items: RestoreMilestoneBody[]): Promise<MilestoneDto[]> {
  await db.transaction(async (tx) => {
    await tx.delete(mediaFiles);
    await tx.delete(milestones);

    if (items.length === 0) {
      return;
    }

    const now: string = new Date().toISOString();
    await tx.insert(milestones).values(
      items.map((item) => ({
        id: item.id ?? createId(),
        title: item.title,
        date: item.date,
        datePrecision: item.datePrecision,
        direction: item.direction,
        categoryId: item.categoryId,
        color: item.color,
        note: item.note ?? "",
        url: item.url ?? "",
        recurrence: item.recurrence ?? null,
        recurrenceId: item.recurrenceId ?? null,
        createdAt: item.createdAt ?? now,
        updatedAt: item.updatedAt ?? now,
      })),
    );
  });

  return listMilestones();
}
