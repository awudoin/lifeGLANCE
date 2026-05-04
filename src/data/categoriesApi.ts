import { apiRequest } from "./apiClient";
import type { CategoryRecord } from "./types";

export function replaceCategoriesRemote(categories: CategoryRecord[]): Promise<CategoryRecord[]> {
    return apiRequest<CategoryRecord[]>("/categories", {
        method: "PUT",
        body: JSON.stringify(categories),
    });
}
