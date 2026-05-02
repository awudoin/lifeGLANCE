import { relations, sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const milestones = sqliteTable("milestones", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  datePrecision: text("date_precision").notNull(),
  direction: text("direction").notNull(),
  categoryId: text("category_id").notNull(),
  color: text("color").notNull(),
  note: text("note").notNull().default(""),
  url: text("url").notNull().default(""),
  recurrence: text("recurrence"),
  recurrenceId: text("recurrence_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  dateIndex: index("milestones_date_idx").on(table.date),
  categoryIndex: index("milestones_category_id_idx").on(table.categoryId),
  recurrenceIndex: index("milestones_recurrence_id_idx").on(table.recurrenceId),
}));

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  color: text("color").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const mediaFiles = sqliteTable("media_files", {
  id: text("id").primaryKey(),
  milestoneId: text("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storagePath: text("storage_path").notNull(),
  sha256: text("sha256").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  milestoneIndex: index("media_files_milestone_id_idx").on(table.milestoneId),
  milestoneKindIndex: index("media_files_milestone_kind_idx").on(table.milestoneId, table.kind),
}));

export const schemaMetadata = sqliteTable("schema_metadata", {
  namespace: text("namespace").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  pk: primaryKey({ columns: [table.namespace, table.key] }),
}));

export const milestoneRelations = relations(milestones, ({ many }) => ({
  mediaFiles: many(mediaFiles),
}));

export const mediaFileRelations = relations(mediaFiles, ({ one }) => ({
  milestone: one(milestones, {
    fields: [mediaFiles.milestoneId],
    references: [milestones.id],
  }),
}));

export type MilestoneRow = typeof milestones.$inferSelect;
export type NewMilestoneRow = typeof milestones.$inferInsert;
export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;
export type SettingRow = typeof settings.$inferSelect;
export type NewSettingRow = typeof settings.$inferInsert;
export type MediaFileRow = typeof mediaFiles.$inferSelect;
export type NewMediaFileRow = typeof mediaFiles.$inferInsert;
