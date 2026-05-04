import { asc } from "drizzle-orm";
import { db } from "../db/client.js";
import { categories, mediaFiles, milestones, settings } from "../db/schema.js";
import type { BackupBundleDto, BackupRestoreBody, BrowserLocalImportBody } from "../types.js";
import { clearMediaRoot, persistBufferUpload, readMediaFileBase64 } from "../utils/files.js";
import { createId } from "../utils/ids.js";
import { setSchemaMetadataValue } from "./schemaMetadataRepo.js";

function decodeBase64(input: string): Buffer {
    return Buffer.from(input, "base64");
}

async function replaceAllData(input: {
    milestones: BackupRestoreBody["milestones"];
    categories: BackupRestoreBody["categories"];
    settings: BackupRestoreBody["settings"];
    mediaFiles: BackupRestoreBody["mediaFiles"];
}): Promise<void> {
    clearMediaRoot();

    await db.transaction((tx) => {
        tx.delete(mediaFiles).run();
        tx.delete(milestones).run();
        tx.delete(categories).run();
        tx.delete(settings).run();

        const now: string = new Date().toISOString();

        if (input.categories.length > 0) {
            tx.insert(categories)
                .values(
                    input.categories.map((item) => ({
                        id: item.id,
                        label: item.label,
                        color: item.color,
                        createdAt: now,
                        updatedAt: now,
                    })),
                )
                .run();
        }

        if (input.settings.length > 0) {
            tx.insert(settings)
                .values(
                    input.settings.map((item) => ({
                        key: item.key,
                        value: item.value,
                        updatedAt: now,
                    })),
                )
                .run();
        }

        if (input.milestones.length > 0) {
            tx.insert(milestones)
                .values(
                    input.milestones.map((item) => ({
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
                )
                .run();
        }

        if (input.mediaFiles.length > 0) {
            const rows = input.mediaFiles.map((item) => {
                const stored = persistBufferUpload({
                    buffer: decodeBase64(item.dataBase64),
                    originalName: item.originalName,
                    mimeType: item.mimeType,
                    ...(item.id ? { id: item.id } : {}),
                });

                return {
                    id: stored.id,
                    milestoneId: item.milestoneId,
                    kind: item.kind,
                    originalName: stored.originalName,
                    mimeType: stored.mimeType,
                    sizeBytes: stored.sizeBytes,
                    storagePath: stored.storagePath,
                    sha256: stored.sha256,
                    createdAt: item.createdAt ?? now,
                };
            });

            tx.insert(mediaFiles).values(rows).run();
        }
    });
}

export async function exportBackupBundle(): Promise<BackupBundleDto> {
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
        version: "1",
        exportedAt: new Date().toISOString(),
        milestones: milestoneRows.map((row) => ({
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
        })),
        categories: categoryRows.map((row) => ({
            id: row.id,
            label: row.label,
            color: row.color,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        })),
        settings: settingRows.map((row) => ({
            key: row.key,
            value: row.value,
            updatedAt: row.updatedAt,
        })),
        mediaFiles: mediaRows.map((row) => ({
            id: row.id,
            milestoneId: row.milestoneId,
            kind: row.kind,
            originalName: row.originalName,
            mimeType: row.mimeType,
            sizeBytes: row.sizeBytes,
            storagePath: row.storagePath,
            sha256: row.sha256,
            createdAt: row.createdAt,
            dataBase64: readMediaFileBase64(row.storagePath),
        })),
    };
}

export async function restoreBackupBundle(bundle: BackupRestoreBody): Promise<void> {
    await replaceAllData(bundle);
}

export async function importBrowserLocalData(bundle: BrowserLocalImportBody): Promise<void> {
    const mediaWithIds = bundle.mediaFiles.map((item): BackupRestoreBody["mediaFiles"][number] => ({
        ...item,
        id: createId(),
    }));

    await replaceAllData({
        milestones: bundle.milestones,
        categories: bundle.categories,
        settings: bundle.settings,
        mediaFiles: mediaWithIds,
    });

    await setSchemaMetadataValue(
        "migration",
        "browser_local_import_completed",
        new Date().toISOString(),
    );
}
