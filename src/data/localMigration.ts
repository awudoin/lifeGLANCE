import { loadCategories } from "../utils/colors";
import { dbGetAll, dbGetAllMedia, initDB } from "./db";
import type {
    FrontendMilestone,
    LocalMigrationBundle,
    LocalMigrationMediaInput,
    MediaKind,
    ServerMilestoneInput,
    SettingRecord,
} from "./types";

const MIGRATION_DISMISS_KEY = "lifeglance-local-import-dismissed";

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

function parseDataUrl(dataUrl: string): { mimeType: string; dataBase64: string } | null {
    const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
    if (!match) return null;
    const mimeType = match[1];
    const dataBase64 = match[2];
    if (!mimeType || !dataBase64) return null;
    return { mimeType, dataBase64 };
}

function extensionForMimeType(mimeType: string): string {
    const subtype = mimeType.split("/")[1] ?? "bin";
    return subtype.replace(/[^a-z0-9]+/gi, "").toLowerCase() || "bin";
}

function inferMediaKind(mimeType: string, fallback: MediaKind = "audio"): MediaKind {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return fallback;
}

function loadLocalSettings(): SettingRecord[] {
    const settings: SettingRecord[] = [];

    const textSize = localStorage.getItem("lifeglance-text-size");
    if (textSize) settings.push({ key: "lifeglance-text-size", value: textSize });

    const clustering = localStorage.getItem("lifeglance-clustering");
    if (clustering) settings.push({ key: "lifeglance-clustering", value: clustering });

    const birthday = localStorage.getItem("lifeglance-birthday");
    if (birthday) settings.push({ key: "lifeglance-birthday", value: birthday });

    const sound = localStorage.getItem("lifeglance-sound");
    if (sound) settings.push({ key: "lifeglance-sound", value: sound });

    return settings;
}

export function dismissLocalMigrationPrompt(): void {
    localStorage.setItem(MIGRATION_DISMISS_KEY, "true");
}

export function clearLocalMigrationPromptDismissal(): void {
    localStorage.removeItem(MIGRATION_DISMISS_KEY);
}

export function isLocalMigrationPromptDismissed(): boolean {
    return localStorage.getItem(MIGRATION_DISMISS_KEY) === "true";
}

export async function collectLocalMigrationBundle(): Promise<{
    bundle: LocalMigrationBundle;
    hasData: boolean;
}> {
    await initDB();

    const [milestones, mediaRecords] = await Promise.all([dbGetAll(), dbGetAllMedia()]);
    const categories = loadCategories();
    const settings = loadLocalSettings();

    const mediaItems: LocalMigrationMediaInput[] = [];
    const milestoneById = new Map(milestones.map((item) => [item.id, item]));

    for (const milestone of milestones) {
        if (!milestone.photo_uri.startsWith("data:")) continue;
        const parsed = parseDataUrl(milestone.photo_uri);
        if (!parsed) continue;
        const ext = extensionForMimeType(parsed.mimeType);
        mediaItems.push({
            milestoneId: milestone.id,
            kind: "image",
            originalName: `${milestone.id}-photo.${ext}`,
            mimeType: parsed.mimeType,
            dataBase64: parsed.dataBase64,
        });
    }

    for (const record of mediaRecords) {
        const milestone = milestoneById.get(record.id);
        const fallbackKind = milestone?.media_type === "video" ? "video" : "audio";
        const dataBase64 = await record.blob.arrayBuffer().then((buffer) => {
            let binary = "";
            const bytes = new Uint8Array(buffer);
            for (const byte of bytes) {
                binary += String.fromCharCode(byte);
            }
            return btoa(binary);
        });
        const ext = extensionForMimeType(record.mimeType);
        mediaItems.push({
            milestoneId: record.id,
            kind: inferMediaKind(record.mimeType, fallbackKind),
            originalName: `${record.id}-media.${ext}`,
            mimeType: record.mimeType,
            dataBase64,
        });
    }

    const bundle: LocalMigrationBundle = {
        milestones: milestones.map(toServerMilestone),
        categories,
        settings,
        mediaFiles: mediaItems,
    };

    const hasData =
        bundle.milestones.length > 0 ||
        bundle.mediaFiles.length > 0 ||
        settings.length > 0 ||
        localStorage.getItem("lifeglance-categories") !== null;

    return { bundle, hasData };
}
