import { apiRequest } from "./apiClient";
import type { ServerMilestone, ServerMilestoneInput } from "./types";

export function createMilestoneRemote(payload: ServerMilestoneInput): Promise<ServerMilestone> {
    return apiRequest<ServerMilestone>("/milestones", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateMilestoneRemote(id: string, payload: ServerMilestoneInput): Promise<ServerMilestone> {
    return apiRequest<ServerMilestone>(`/milestones/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function deleteMilestoneRemote(id: string): Promise<void> {
    return apiRequest<void>(`/milestones/${id}`, {
        method: "DELETE",
    });
}

export function deleteRecurrenceRemote(recurrenceId: string): Promise<{ deletedCount: number }> {
    return apiRequest<{ deletedCount: number }>(`/recurrences/${recurrenceId}`, {
        method: "DELETE",
    });
}

export function restoreMilestonesRemote(payload: ServerMilestoneInput[]): Promise<ServerMilestone[]> {
    return apiRequest<ServerMilestone[]>("/milestones/restore", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
