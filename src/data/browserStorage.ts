import type { CategoryRecord } from "./types";

const TEXT_SIZE_KEY = "lifeglance-text-size";
const CLUSTERING_KEY = "lifeglance-clustering";
const BIRTHDAY_KEY = "lifeglance-birthday";
const SOUND_KEY = "lifeglance-sound";
const CATEGORIES_KEY = "lifeglance-categories";
const MIGRATION_DISMISS_KEY = "lifeglance-local-import-dismissed";

function readStorageValue(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorageValue(key: string, value: string): void {
    localStorage.setItem(key, value);
}

function removeStorageValue(key: string): void {
    localStorage.removeItem(key);
}

export function readCachedTextSize(): string | null {
    return readStorageValue(TEXT_SIZE_KEY);
}

export function writeCachedTextSize(value: string): void {
    writeStorageValue(TEXT_SIZE_KEY, value);
}

export function readCachedClustering(): string | null {
    return readStorageValue(CLUSTERING_KEY);
}

export function writeCachedClustering(value: boolean): void {
    writeStorageValue(CLUSTERING_KEY, String(value));
}

export function readCachedBirthday(): string {
    return readStorageValue(BIRTHDAY_KEY) ?? "";
}

export function writeCachedBirthday(value: string): void {
    writeStorageValue(BIRTHDAY_KEY, value);
}

export function readCachedSound(): string | null {
    return readStorageValue(SOUND_KEY);
}

export function writeCachedSound(isOn: boolean): void {
    writeStorageValue(SOUND_KEY, isOn ? "on" : "off");
}

export function loadCachedCategories(defaultCategories: CategoryRecord[]): CategoryRecord[] {
    try {
        const raw = readStorageValue(CATEGORIES_KEY);
        if (raw) return JSON.parse(raw) as CategoryRecord[];
    } catch {}
    return defaultCategories;
}

export function saveCachedCategories(categories: CategoryRecord[]): void {
    writeStorageValue(CATEGORIES_KEY, JSON.stringify(categories));
}

export function hasCachedCategories(): boolean {
    return readStorageValue(CATEGORIES_KEY) !== null;
}

export function dismissLocalMigrationPrompt(): void {
    writeStorageValue(MIGRATION_DISMISS_KEY, "true");
}

export function clearLocalMigrationPromptDismissal(): void {
    removeStorageValue(MIGRATION_DISMISS_KEY);
}

export function isLocalMigrationPromptDismissed(): boolean {
    return readStorageValue(MIGRATION_DISMISS_KEY) === "true";
}

export function estimateLocalStorageBytes(): number | null {
    try {
        return Object.keys(localStorage).reduce(
            (sum, key) => sum + (localStorage.getItem(key)?.length ?? 0) * 2,
            0,
        );
    } catch {
        return null;
    }
}
