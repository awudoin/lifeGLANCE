import fs from "node:fs";
import { type NextFunction, type Request, type Response, Router } from "express";
import multer from "multer";
import { createMediaRecord, deleteMediaRecord, findMediaRecord } from "../repos/mediaRepo.js";
import { persistUpload, resolveMediaAbsolutePath } from "../utils/files.js";

const upload = multer({ storage: multer.memoryStorage() });

export const mediaRouter: Router = Router();

function getSingleParam(value: string | string[] | undefined): string | null {
    return typeof value === "string" ? value : null;
}

mediaRouter.post(
    "/media",
    upload.single("file"),
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const milestoneId: string | undefined =
                typeof request.body.milestoneId === "string" ? request.body.milestoneId : undefined;
            const kind: string | undefined =
                typeof request.body.kind === "string" ? request.body.kind : undefined;
            const file = request.file;

            if (!milestoneId || !kind || !file) {
                response.status(400).json({
                    error: "invalid_body",
                    message: "Media upload requires milestoneId, kind, and file.",
                });
                return;
            }

            const stored = persistUpload(file);
            const record = await createMediaRecord({
                id: stored.id,
                milestoneId,
                kind,
                originalName: stored.originalName,
                mimeType: stored.mimeType,
                sizeBytes: stored.sizeBytes,
                storagePath: stored.storagePath,
                sha256: stored.sha256,
            });

            response.status(201).json(record);
        } catch (error) {
            next(error);
        }
    },
);

mediaRouter.get("/media/:id", async (request: Request, response: Response, next: NextFunction) => {
    try {
        const mediaId = getSingleParam(request.params.id);
        if (!mediaId) {
            response.status(400).json({
                error: "invalid_param",
                message: "Media id is required.",
            });
            return;
        }

        const record = await findMediaRecord(mediaId);
        if (!record) {
            response.status(404).json({
                error: "not_found",
                message: "Media file was not found.",
            });
            return;
        }

        const absolutePath: string = resolveMediaAbsolutePath(record.storagePath);
        if (!fs.existsSync(absolutePath)) {
            response.status(404).json({
                error: "not_found",
                message: "Media file is missing on disk.",
            });
            return;
        }

        response.type(record.mimeType);
        response.sendFile(absolutePath);
    } catch (error) {
        next(error);
    }
});

mediaRouter.delete(
    "/media/:id",
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const mediaId = getSingleParam(request.params.id);
            if (!mediaId) {
                response.status(400).json({
                    error: "invalid_param",
                    message: "Media id is required.",
                });
                return;
            }

            const record = await deleteMediaRecord(mediaId);
            if (!record) {
                response.status(404).json({
                    error: "not_found",
                    message: "Media file was not found.",
                });
                return;
            }

            const absolutePath: string = resolveMediaAbsolutePath(record.storagePath);
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }

            response.status(204).send();
        } catch (error) {
            next(error);
        }
    },
);
