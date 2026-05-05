import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { createId } from "./ids.js";

export interface StoredUpload {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    sha256: string;
    storagePath: string;
    absolutePath: string;
}

function extensionForName(originalName: string): string {
    const ext: string = path.extname(originalName).trim();
    return ext.length > 0 ? ext.toLowerCase() : "";
}

export function persistUpload(file: Express.Multer.File): StoredUpload {
    return persistBufferUpload({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
    });
}

async function hashFile(absolutePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const stream = fs.createReadStream(absolutePath);
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", () => resolve(hash.digest("hex")));
        stream.on("error", reject);
    });
}

async function moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
        fs.renameSync(sourcePath, destinationPath);
    } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code !== "EXDEV") {
            throw error;
        }

        await fs.promises.copyFile(sourcePath, destinationPath);
        await fs.promises.unlink(sourcePath);
    }
}

export async function persistStagedUpload(file: Express.Multer.File): Promise<StoredUpload> {
    if (!file.path) {
        throw new Error("Staged upload file path is missing.");
    }

    const id: string = createId();
    const sha256 = await hashFile(file.path);
    const ext: string = extensionForName(file.originalname);
    const relativeDir: string = path.join(sha256.slice(0, 2), sha256.slice(2, 4));
    const relativePath: string = path.join(relativeDir, `${id}${ext}`);
    const absoluteDir: string = path.join(config.mediaRoot, relativeDir);
    const absolutePath: string = path.join(config.mediaRoot, relativePath);

    fs.mkdirSync(absoluteDir, { recursive: true });

    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(file.path);
    } else {
        await moveFile(file.path, absolutePath);
    }

    return {
        id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        sha256,
        storagePath: relativePath,
        absolutePath,
    };
}

export function persistBufferUpload(input: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    sizeBytes?: number;
    id?: string;
}): StoredUpload {
    const id: string = input.id ?? createId();
    const hash: string = crypto.createHash("sha256").update(input.buffer).digest("hex");
    const ext: string = extensionForName(input.originalName);
    const relativeDir: string = path.join(hash.slice(0, 2), hash.slice(2, 4));
    const relativePath: string = path.join(relativeDir, `${id}${ext}`);
    const absoluteDir: string = path.join(config.mediaRoot, relativeDir);
    const absolutePath: string = path.join(config.mediaRoot, relativePath);

    fs.mkdirSync(absoluteDir, { recursive: true });
    fs.writeFileSync(absolutePath, input.buffer);

    return {
        id,
        originalName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes ?? input.buffer.length,
        sha256: hash,
        storagePath: relativePath,
        absolutePath,
    };
}

export function resolveMediaAbsolutePath(storagePath: string): string {
    return path.join(config.mediaRoot, storagePath);
}

export function clearMediaRoot(): void {
    fs.rmSync(config.mediaRoot, { recursive: true, force: true });
    fs.mkdirSync(config.mediaRoot, { recursive: true });
}

export function readMediaFileBase64(storagePath: string): string {
    return fs.readFileSync(resolveMediaAbsolutePath(storagePath)).toString("base64");
}
