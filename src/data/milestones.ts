import { categoryColor } from "../utils/colors";
import { fetchBootstrap } from "./bootstrapApi";
import { dbDelete, dbGetAll, dbPut, dbReplaceAllMilestones, initDB } from "./db";
import { getMediaUrl } from "./mediaApi";
import {
    createMilestoneRemote,
    deleteMilestoneRemote,
    restoreMilestonesRemote,
    updateMilestoneRemote,
} from "./milestonesApi";
import type {
    FrontendMilestone,
    FrontendMilestoneInput,
    MediaFileRecord,
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
    photo_media_id = null,
    media_type = null,
    media_file_id = null,
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
        photo_media_id,
        media_type,
        media_file_id,
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
    mediaFiles: MediaFileRecord[],
): FrontendMilestone {
    const photo = mediaFiles.find((item) => item.kind === "image") ?? null;
    const media = mediaFiles.find((item) => item.kind === "audio" || item.kind === "video") ?? null;

    return {
        id: serverItem.id,
        title: serverItem.title,
        date: serverItem.date,
        date_precision: serverItem.datePrecision,
        direction: serverItem.direction,
        category: serverItem.categoryId,
        color: serverItem.color,
        note: serverItem.note,
        photo_uri: photo ? getMediaUrl(photo.id) : "",
        photo_media_id: photo?.id ?? null,
        media_type: media && (media.kind === "audio" || media.kind === "video") ? media.kind : null,
        media_file_id: media?.id ?? null,
        url: serverItem.url,
        recurrence: serverItem.recurrence,
        recurrence_id: serverItem.recurrenceId,
        created_at: serverItem.createdAt,
        updated_at: serverItem.updatedAt,
    };
}

async function syncLocalCacheWithRemote(
    remoteItems: ServerMilestone[],
    mediaFiles: MediaFileRecord[],
): Promise<FrontendMilestone[]> {
    const mediaByMilestone = new Map<string, MediaFileRecord[]>();
    for (const item of mediaFiles) {
        const group = mediaByMilestone.get(item.milestoneId);
        if (group) {
            group.push(item);
        } else {
            mediaByMilestone.set(item.milestoneId, [item]);
        }
    }

    const merged = remoteItems.map((item) =>
        mergeServerMilestone(item, mediaByMilestone.get(item.id) ?? []),
    );
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

        return syncLocalCacheWithRemote(bootstrap.milestones, bootstrap.mediaFiles);
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
    const merged = {
        ...mergeServerMilestone(remoteMilestone, []),
        photo_uri: localMilestone.photo_uri,
        photo_media_id: localMilestone.photo_media_id ?? null,
        media_type: localMilestone.media_type,
        media_file_id: localMilestone.media_file_id ?? null,
    };
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
    const merged = {
        ...mergeServerMilestone(remoteMilestone, []),
        photo_uri: mergedLocal.photo_uri,
        photo_media_id: mergedLocal.photo_media_id ?? null,
        media_type: mergedLocal.media_type,
        media_file_id: mergedLocal.media_file_id ?? null,
    };
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
        photo_uri: "",
        photo_media_id: null,
        media_type: null,
        media_file_id: null,
    }));

    const remoteItems = await restoreMilestonesRemote(localItems.map(toServerMilestone));
    return syncLocalCacheWithRemote(remoteItems, []);
}
