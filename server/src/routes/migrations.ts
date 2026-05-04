import { type NextFunction, type Request, type Response, Router } from "express";
import { importBrowserLocalData } from "../repos/backupRepo.js";
import { getSchemaMetadataValue } from "../repos/schemaMetadataRepo.js";
import type {
    BrowserLocalImportBody,
    CategoryInput,
    MediaImportInput,
    MigrationStatusDto,
    RestoreMilestoneBody,
    SettingInput,
} from "../types.js";

export const migrationRouter: Router = Router();

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

function isBrowserLocalImportBody(value: unknown): value is BrowserLocalImportBody {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
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

migrationRouter.get(
    "/migrations/browser-local/status",
    async (_request: Request, response: Response, next: NextFunction) => {
        try {
            const value = await getSchemaMetadataValue(
                "migration",
                "browser_local_import_completed",
            );
            const payload: MigrationStatusDto = { completed: value !== null };
            response.json(payload);
        } catch (error) {
            next(error);
        }
    },
);

migrationRouter.post(
    "/migrations/browser-local/import",
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            if (!isBrowserLocalImportBody(request.body)) {
                response.status(400).json({
                    error: "invalid_body",
                    message: "Browser-local migration payload is invalid.",
                });
                return;
            }

            await importBrowserLocalData(request.body);
            const payload: MigrationStatusDto = { completed: true };
            response.json(payload);
        } catch (error) {
            next(error);
        }
    },
);
