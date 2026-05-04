import { type NextFunction, type Request, type Response, Router } from "express";
import { exportBackupBundle, restoreBackupBundle } from "../repos/backupRepo.js";
import type {
    BackupRestoreBody,
    CategoryInput,
    MediaImportInput,
    RestoreMilestoneBody,
    SettingInput,
} from "../types.js";

export const backupRouter: Router = Router();

function isCategoryInput(value: unknown): value is CategoryInput {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.id === "string" &&
        typeof candidate.label === "string" &&
        typeof candidate.color === "string"
    );
}

function isSettingInput(value: unknown): value is SettingInput {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate.key === "string" && typeof candidate.value === "string";
}

function isRestoreMilestoneBody(value: unknown): value is RestoreMilestoneBody {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.title === "string" &&
        typeof candidate.date === "string" &&
        typeof candidate.datePrecision === "string" &&
        typeof candidate.direction === "string" &&
        typeof candidate.categoryId === "string" &&
        typeof candidate.color === "string"
    );
}

function isMediaImportInput(value: unknown): value is MediaImportInput {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.milestoneId === "string" &&
        typeof candidate.kind === "string" &&
        typeof candidate.originalName === "string" &&
        typeof candidate.mimeType === "string" &&
        typeof candidate.dataBase64 === "string"
    );
}

function isBackupRestoreBody(value: unknown): value is BackupRestoreBody {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.version === "string" &&
        typeof candidate.exportedAt === "string" &&
        Array.isArray(candidate.milestones) &&
        candidate.milestones.every(isRestoreMilestoneBody) &&
        Array.isArray(candidate.categories) &&
        candidate.categories.every(isCategoryInput) &&
        Array.isArray(candidate.settings) &&
        candidate.settings.every(isSettingInput) &&
        Array.isArray(candidate.mediaFiles) &&
        candidate.mediaFiles.every(isMediaImportInput)
    );
}

backupRouter.get("/backup", async (_request: Request, response: Response, next: NextFunction) => {
    try {
        response.json(await exportBackupBundle());
    } catch (error) {
        next(error);
    }
});

backupRouter.post(
    "/backup/restore",
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            if (!isBackupRestoreBody(request.body)) {
                response.status(400).json({
                    error: "invalid_body",
                    message: "Backup restore payload is invalid.",
                });
                return;
            }

            await restoreBackupBundle(request.body);
            response.status(204).send();
        } catch (error) {
            next(error);
        }
    },
);
