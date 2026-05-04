import { apiRequest } from "./apiClient";
import type { SettingRecord } from "./types";

export function replaceSettingsRemote(settings: SettingRecord[]): Promise<SettingRecord[]> {
    return apiRequest<SettingRecord[]>("/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
    });
}
