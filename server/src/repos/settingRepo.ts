import { asc } from "drizzle-orm";
import { db } from "../db/client.js";
import { settings } from "../db/schema.js";
import type { SettingDto, SettingInput } from "../types.js";
import { mapSetting } from "./mappers.js";

export async function listSettings(): Promise<SettingDto[]> {
  const rows = await db.select().from(settings).orderBy(asc(settings.key));
  return rows.map(mapSetting);
}

export async function replaceSettings(items: SettingInput[]): Promise<SettingDto[]> {
  const now: string = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx.delete(settings);
    if (items.length > 0) {
      await tx.insert(settings).values(
        items.map((item) => ({
          key: item.key,
          value: item.value,
          updatedAt: now,
        })),
      );
    }
  });

  return listSettings();
}
