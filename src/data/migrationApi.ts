import { apiRequest } from "./apiClient";
import type { LocalMigrationBundle, LocalMigrationStatus } from "./types";

export function fetchLocalMigrationStatus(): Promise<LocalMigrationStatus> {
    return apiRequest<LocalMigrationStatus>("/migrations/browser-local/status");
}

export function importLocalMigrationBundle(
    bundle: LocalMigrationBundle,
): Promise<LocalMigrationStatus> {
    return apiRequest<LocalMigrationStatus>("/migrations/browser-local/import", {
        method: "POST",
        body: JSON.stringify(bundle),
    });
}
