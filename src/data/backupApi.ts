import { apiRequest } from "./apiClient";
import type { BackupBundle } from "./types";

export function fetchBackupBundle(): Promise<BackupBundle> {
    return apiRequest<BackupBundle>("/backup");
}

export function restoreBackupBundle(bundle: BackupBundle): Promise<void> {
    return apiRequest<void>("/backup/restore", {
        method: "POST",
        body: JSON.stringify(bundle),
    });
}
