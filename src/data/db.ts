import type { FrontendMilestone } from "./types";

const DB_NAME = "lifeglance";
const DB_VERSION = 2;
const STORE = "milestones";
const MEDIA = "media";

let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase> | null = null;

export function initDB(): Promise<IDBDatabase> {
    if (dbInstance) {
        return Promise.resolve(dbInstance);
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(STORE)) {
                const store = db.createObjectStore(STORE, { keyPath: "id" });
                store.createIndex("date", "date", { unique: false });
                store.createIndex("category", "category", { unique: false });
            }

            if ((event.oldVersion ?? 0) < 2) {
                if (!db.objectStoreNames.contains(MEDIA)) {
                    db.createObjectStore(MEDIA, { keyPath: "id" });
                }

                const transaction = (event.target as IDBOpenDBRequest).transaction;
                if (!transaction) {
                    return;
                }

                const store = transaction.objectStore(STORE);
                store.openCursor().onsuccess = (cursorEvent: Event) => {
                    const cursor = (cursorEvent.target as IDBRequest<IDBCursorWithValue | null>)
                        .result;
                    if (!cursor) {
                        return;
                    }

                    const value = cursor.value as Record<string, unknown>;
                    if ("audio_uri" in value) {
                        const nextRecord = { ...value };
                        delete nextRecord.audio_uri;
                        cursor.update(nextRecord);
                    }

                    cursor.continue();
                };
            }
        };

        request.onsuccess = (event: Event) => {
            dbInstance = (event.target as IDBOpenDBRequest).result;
            resolve(dbInstance);
        };

        request.onerror = () => reject(request.error);
    });

    return initPromise;
}

function milestoneStore(mode: IDBTransactionMode = "readonly"): IDBObjectStore {
    if (!dbInstance) {
        throw new Error("IndexedDB has not been initialized.");
    }

    return dbInstance.transaction(STORE, mode).objectStore(STORE);
}

function mediaStore(mode: IDBTransactionMode = "readonly"): IDBObjectStore {
    if (!dbInstance) {
        throw new Error("IndexedDB has not been initialized.");
    }

    return dbInstance.transaction(MEDIA, mode).objectStore(MEDIA);
}

export function dbGetAll(): Promise<FrontendMilestone[]> {
    return new Promise((resolve, reject) => {
        const request = milestoneStore().getAll();
        request.onsuccess = () => resolve(request.result as FrontendMilestone[]);
        request.onerror = () => reject(request.error);
    });
}

export function dbAdd(item: FrontendMilestone): Promise<FrontendMilestone> {
    return new Promise((resolve, reject) => {
        const request = milestoneStore("readwrite").add(item);
        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
    });
}

export function dbPut(item: FrontendMilestone): Promise<FrontendMilestone> {
    return new Promise((resolve, reject) => {
        const request = milestoneStore("readwrite").put(item);
        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
    });
}

export function dbDelete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = milestoneStore("readwrite").delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export function dbClearAllMilestones(): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = milestoneStore("readwrite").clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function dbReplaceAllMilestones(
    items: FrontendMilestone[],
): Promise<FrontendMilestone[]> {
    await dbClearAllMilestones();
    for (const item of items) {
        await dbPut(item);
    }

    return items;
}

export function dbPutMedia(id: string, blob: Blob, mimeType: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = mediaStore("readwrite").put({ id, blob, mimeType });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export function dbGetMedia(id: string): Promise<{ blob: Blob; mimeType: string } | null> {
    return new Promise((resolve, reject) => {
        const request = mediaStore().get(id);
        request.onsuccess = () => {
            const record = request.result as { blob: Blob; mimeType: string } | undefined;
            resolve(record ? { blob: record.blob, mimeType: record.mimeType } : null);
        };
        request.onerror = () => reject(request.error);
    });
}

export function dbGetAllMedia(): Promise<Array<{ id: string; blob: Blob; mimeType: string }>> {
    return new Promise((resolve, reject) => {
        const request = mediaStore().getAll();
        request.onsuccess = () =>
            resolve(
                (request.result as
                    | Array<{ id: string; blob: Blob; mimeType: string }>
                    | undefined) ?? [],
            );
        request.onerror = () => reject(request.error);
    });
}

export function dbClearAllMedia(): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = mediaStore("readwrite").clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function syncMilestoneCacheRecord(
    item: FrontendMilestone,
): Promise<FrontendMilestone> {
    await initDB();
    return dbPut(item);
}
