import { asc } from "drizzle-orm";
import { db } from "../db/client.js";
import { categories, mediaFiles, milestones, settings } from "../db/schema.js";
import type { BootstrapResponse } from "../types.js";
import { mapCategory, mapMediaFile, mapMilestone, mapSetting } from "./mappers.js";

export async function loadBootstrap(): Promise<BootstrapResponse> {
    const milestoneRows = await db
        .select()
        .from(milestones)
        .orderBy(asc(milestones.date), asc(milestones.createdAt));
    const categoryRows = await db.select().from(categories).orderBy(asc(categories.label));
    const settingRows = await db.select().from(settings).orderBy(asc(settings.key));
    const mediaRows = await db
        .select()
        .from(mediaFiles)
        .orderBy(asc(mediaFiles.milestoneId), asc(mediaFiles.createdAt));

    return {
        milestones: milestoneRows.map(mapMilestone),
        categories: categoryRows.map(mapCategory),
        settings: settingRows.map(mapSetting),
        mediaFiles: mediaRows.map(mapMediaFile),
    };
}
