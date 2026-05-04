import { apiRequest, apiUrl } from "./apiClient";
import type { MediaFileRecord, MediaKind } from "./types";

export function getMediaUrl(id: string): string {
    return apiUrl(`/media/${id}`);
}

export async function uploadMediaFile(
    milestoneId: string,
    kind: MediaKind,
    file: File,
): Promise<MediaFileRecord> {
    const body = new FormData();
    body.set("milestoneId", milestoneId);
    body.set("kind", kind);
    body.set("file", file);

    return apiRequest<MediaFileRecord>("/media", {
        method: "POST",
        body,
    });
}

export async function deleteMediaFile(id: string): Promise<void> {
    return apiRequest<void>(`/media/${id}`, {
        method: "DELETE",
    });
}
