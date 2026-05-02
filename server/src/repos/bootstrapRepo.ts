import { asc } from "drizzle-orm";
import { db } from "../db/client.js";
import { categories, milestones, settings } from "../db/schema.js";
import type { BootstrapResponse } from "../types.js";
import { mapCategory, mapMilestone, mapSetting } from "./mappers.js";

export async function loadBootstrap(): Promise<BootstrapResponse> {
  const milestoneRows = await db.select().from(milestones).orderBy(asc(milestones.date), asc(milestones.createdAt));
  const categoryRows = await db.select().from(categories).orderBy(asc(categories.label));
  const settingRows = await db.select().from(settings).orderBy(asc(settings.key));

  return {
    milestones: milestoneRows.map(mapMilestone),
    categories: categoryRows.map(mapCategory),
    settings: settingRows.map(mapSetting),
  };
}
