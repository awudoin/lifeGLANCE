import fs from "node:fs";
import { type NextFunction, type Request, type Response, Router } from "express";
import multer from "multer";
import { config } from "../config.js";
import { createMediaRecord, deleteMediaRecord, findMediaRecord } from "../repos/mediaRepo.js";
import { persistStagedUpload, resolveMediaAbsolutePath } from "../utils/files.js";

const uploadTempDir = config.uploadTempRoot;
fs.mkdirSync(uploadTempDir, { recursive: true });

const upload = multer({
    storage: multer.diskStorage({
        destination: (_request, _file, callback) => callback(null, uploadTempDir),
        filename: (_request, file, callback) => {
            const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            callback(null, `${suffix}-${file.originalname}`);
        },
    }),
    limits: {
        fileSize: 1024 * 1024 * 1024,
    },
});

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

            const stored = await persistStagedUpload(file);
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

mediaRouter.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        response.status(413).json({
            error: "file_too_large",
            message: "Uploaded media exceeds the server file size limit.",
        });
        return;
    }

    next(error);
});

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
