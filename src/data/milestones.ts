import { categoryColor } from "../utils/colors";
import { fetchBootstrap } from "./bootstrapApi";
import { dbClearAllMedia, dbDelete, dbGetAll, dbPut, dbReplaceAllMilestones, initDB } from "./db";
import {
    createMilestoneRemote,
    deleteMilestoneRemote,
    restoreMilestonesRemote,
    updateMilestoneRemote,
} from "./milestonesApi";
import type {
    FrontendMilestone,
    FrontendMilestoneInput,
    ServerMilestone,
    ServerMilestoneInput,
} from "./types";

export function uid(): string {
    if (typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
        const randomValue = (crypto.getRandomValues(new Uint8Array(1))[0] ?? 0) & 15;
        return (char === "x" ? randomValue : (randomValue & 0x3) | 0x8).toString(16);
    });
}

export function buildMilestone({
    id,
    title,
    date,
    date_precision = "month",
    category = "personal",
    color,
    note = "",
    photo_uri = "",
    media_type = null,
    url = "",
    recurrence = null,
    recurrence_id = null,
    created_at,
    updated_at,
}: FrontendMilestoneInput): FrontendMilestone {
    const dateObject = date instanceof Date ? date : new Date(date);
    const today = new Date();
    const now = new Date().toISOString();

    return {
        id: id ?? uid(),
        title: title.trim(),
        date: dateObject.toISOString(),
        date_precision,
        direction: dateObject < today ? "past" : "future",
        category,
        color: color || categoryColor(category),
        note,
        photo_uri,
        media_type,
        url,
        recurrence,
        recurrence_id,
        created_at: created_at ?? now,
        updated_at: updated_at ?? now,
    };
}

function toServerMilestone(item: FrontendMilestone): ServerMilestoneInput {
    return {
        id: item.id,
        title: item.title,
        date: typeof item.date === "string" ? item.date : item.date.toISOString(),
        datePrecision: item.date_precision,
        direction: item.direction,
        categoryId: item.category,
        color: item.color,
        note: item.note,
        url: item.url,
        recurrence: item.recurrence,
        recurrenceId: item.recurrence_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
    };
}

function mergeServerMilestone(
    serverItem: ServerMilestone,
    localItem?: FrontendMilestone,
): FrontendMilestone {
    return {
        id: serverItem.id,
        title: serverItem.title,
        date: serverItem.date,
        date_precision: serverItem.datePrecision,
        direction: serverItem.direction,
        category: serverItem.categoryId,
        color: serverItem.color,
        note: serverItem.note,
        photo_uri: localItem?.photo_uri ?? "",
        media_type: localItem?.media_type ?? null,
        url: serverItem.url,
        recurrence: serverItem.recurrence,
        recurrence_id: serverItem.recurrenceId,
        created_at: serverItem.createdAt,
        updated_at: serverItem.updatedAt,
    };
}

async function syncLocalCacheWithRemote(
    remoteItems: ServerMilestone[],
    localItems: FrontendMilestone[],
): Promise<FrontendMilestone[]> {
    const localById = new Map(localItems.map((item) => [item.id, item]));
    const merged = remoteItems.map((item) => mergeServerMilestone(item, localById.get(item.id)));
    await dbReplaceAllMilestones(merged);
    return merged;
}

export async function loadMilestones(): Promise<FrontendMilestone[]> {
    await initDB();
    const localItems = await dbGetAll();

    try {
        const bootstrap = await fetchBootstrap();

        if (bootstrap.milestones.length === 0 && localItems.length > 0) {
            console.warn(
                "Backend milestone store is empty; falling back to local metadata cache until migration is implemented.",
            );
            return localItems;
        }

        return syncLocalCacheWithRemote(bootstrap.milestones, localItems);
    } catch (error) {
        console.warn(
            "Falling back to local milestone cache because backend bootstrap failed.",
            error,
        );
        return localItems;
    }
}

export async function addMilestone(data: FrontendMilestoneInput): Promise<FrontendMilestone> {
    await initDB();
    const localMilestone = buildMilestone(data);
    const remoteMilestone = await createMilestoneRemote(toServerMilestone(localMilestone));
    const merged = mergeServerMilestone(remoteMilestone, localMilestone);
    await dbPut(merged);
    return merged;
}

export async function updateMilestone(
    id: string,
    updates: Partial<FrontendMilestoneInput>,
    existing: FrontendMilestone,
): Promise<FrontendMilestone> {
    await initDB();

    const nextDate =
        updates.date instanceof Date ? updates.date : new Date(updates.date ?? existing.date);
    const now = new Date().toISOString();

    const mergedLocal: FrontendMilestone = {
        ...existing,
        ...updates,
        id,
        date: nextDate.toISOString(),
        date_precision: updates.date_precision ?? existing.date_precision,
        direction: nextDate < new Date() ? "past" : "future",
        category: updates.category ?? existing.category,
        color: updates.color || categoryColor(updates.category ?? existing.category),
        note: updates.note ?? existing.note,
        photo_uri: updates.photo_uri ?? existing.photo_uri,
        media_type: updates.media_type ?? existing.media_type,
        url: updates.url ?? existing.url,
        recurrence: updates.recurrence ?? existing.recurrence,
        recurrence_id: updates.recurrence_id ?? existing.recurrence_id,
        created_at: existing.created_at,
        updated_at: now,
        title: updates.title?.trim() ?? existing.title,
    };

    const remoteMilestone = await updateMilestoneRemote(id, toServerMilestone(mergedLocal));
    const merged = mergeServerMilestone(remoteMilestone, mergedLocal);
    await dbPut(merged);
    return merged;
}

export async function deleteMilestone(id: string): Promise<void> {
    await initDB();
    await deleteMilestoneRemote(id);
    await dbDelete(id);
}

export async function restoreMilestones(items: FrontendMilestone[]): Promise<FrontendMilestone[]> {
    await initDB();
    const localItems = items.map((item) => ({
        ...item,
        media_type: null,
    }));

    const remoteItems = await restoreMilestonesRemote(localItems.map(toServerMilestone));
    await dbClearAllMedia();
    return syncLocalCacheWithRemote(remoteItems, localItems);
}
