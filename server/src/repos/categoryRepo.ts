import { asc } from "drizzle-orm";
import { db } from "../db/client.js";
import { categories } from "../db/schema.js";
import type { CategoryDto, CategoryInput } from "../types.js";
import { mapCategory } from "./mappers.js";

export async function listCategories(): Promise<CategoryDto[]> {
    const rows = await db.select().from(categories).orderBy(asc(categories.label));
    return rows.map(mapCategory);
}

export async function replaceCategories(items: CategoryInput[]): Promise<CategoryDto[]> {
    const now: string = new Date().toISOString();

    await db.transaction(async (tx) => {
        await tx.delete(categories);
        if (items.length > 0) {
            await tx.insert(categories).values(
                items.map((item) => ({
                    id: item.id,
                    label: item.label,
                    color: item.color,
                    createdAt: now,
                    updatedAt: now,
                })),
            );
        }
    });

    return listCategories();
}
