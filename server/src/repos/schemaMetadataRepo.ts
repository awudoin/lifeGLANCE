import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { schemaMetadata } from "../db/schema.js";

export async function getSchemaMetadataValue(
    namespace: string,
    key: string,
): Promise<string | null> {
    const row = await db.query.schemaMetadata.findFirst({
        where: and(eq(schemaMetadata.namespace, namespace), eq(schemaMetadata.key, key)),
    });
    return row?.value ?? null;
}

export async function setSchemaMetadataValue(
    namespace: string,
    key: string,
    value: string,
): Promise<void> {
    const updatedAt: string = new Date().toISOString();
    await db
        .insert(schemaMetadata)
        .values({ namespace, key, value, updatedAt })
        .onConflictDoUpdate({
            target: [schemaMetadata.namespace, schemaMetadata.key],
            set: { value, updatedAt },
        });
}
