CREATE TABLE `milestones` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `date` text NOT NULL,
  `date_precision` text NOT NULL,
  `direction` text NOT NULL,
  `category_id` text NOT NULL,
  `color` text NOT NULL,
  `note` text DEFAULT '' NOT NULL,
  `url` text DEFAULT '' NOT NULL,
  `recurrence` text,
  `recurrence_id` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX `milestones_date_idx` ON `milestones` (`date`);
CREATE INDEX `milestones_category_id_idx` ON `milestones` (`category_id`);
CREATE INDEX `milestones_recurrence_id_idx` ON `milestones` (`recurrence_id`);

CREATE TABLE `categories` (
  `id` text PRIMARY KEY NOT NULL,
  `label` text NOT NULL,
  `color` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE `settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE `media_files` (
  `id` text PRIMARY KEY NOT NULL,
  `milestone_id` text NOT NULL,
  `kind` text NOT NULL,
  `original_name` text NOT NULL,
  `mime_type` text NOT NULL,
  `size_bytes` integer NOT NULL,
  `storage_path` text NOT NULL,
  `sha256` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`milestone_id`) REFERENCES `milestones` (`id`) ON DELETE cascade
);

CREATE INDEX `media_files_milestone_id_idx` ON `media_files` (`milestone_id`);
CREATE INDEX `media_files_milestone_kind_idx` ON `media_files` (`milestone_id`, `kind`);

CREATE TABLE `schema_metadata` (
  `namespace` text NOT NULL,
  `key` text NOT NULL,
  `value` text NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`namespace`, `key`)
);
