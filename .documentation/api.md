# API routes defined in the backend project

| Endpoint | Method | Arguments | Returns | Comments |
|----------|--------|-----------|---------|----------|
| `/api/health` | GET | None | `{ ok: true }` | Health check |
| `/api/bootstrap` | GET | None | `{ milestones, categories, settings, mediaFiles }` | Reduces frontend startup round-trips by sending all data |
| `/api/milestones` | GET | None | `Milestone[]` | Returns milestones ordered by date |
| `/api/milestones` | POST | Milestone body | `Milestone` | Creates milestone and generates ID on the server |
| `/api/milestones/:id` | PUT | Milestone body | `Milestone` | Updates milestone |
| `/api/milestones/:id` | DELETE | None | `204 No Content` | Deletes milestone |
| `/api/recurrences/:recurrenceId` | DELETE | None | `{ deletedCount }` | Deletes all milestones in the recurrence series |
| `/api/milestones/import/ics` | POST | TBD | `501 Not Implemented` | Placeholder for later server-side ICS parsing |
| `/api/milestones/restore` | POST | `Milestone[]` | `Milestone[]` | Replaces all milestone rows, preserves IDs/timestamps when provided |
| `/api/categories` | GET | None | `Category[]` | Returns all categories |
| `/api/categories` | PUT | `Category[]` | `Category[]` | Replaces all categories |
| `/api/settings` | GET | None | `Setting[]` | Returns all settings |
| `/api/settings` | PUT | `Setting[]` | `Setting[]` | Replaces all settings |
| `/api/migrations/browser-local/status` | GET | None | `{ completed }` | Returns whether the one-time browser-local import already ran |
| `/api/migrations/browser-local/import` | POST | `{ milestones, categories, settings, mediaFiles }` | `{ completed: true }` | Imports legacy IndexedDB/localStorage data into the backend and marks migration complete |
| `/api/backup` | GET | None | `BackupBundle` | Exports milestones, media metadata, and media payloads as a JSON backup bundle |
| `/api/backup/restore` | POST | `BackupBundle` | `204 No Content` | Replaces all persisted backend data from a backup bundle |
| `/api/media` | POST | multipart `milestoneId`, `kind`, `file` | `MediaFile` | Saves file to disk and stores metadata in DB |
| `/api/media/:id` | GET | None | File stream | Streams stored file back to client |
| `/api/media/:id` | DELETE | None | `204 No Content` | Deletes media DB row and stored file |

## Payload shape notes

### Milestone
- `title: string`
- `date: string`
- `datePrecision: string`
- `direction: string`
- `categoryId: string`
- `color: string`
- `note?: string`
- `url?: string`
- `recurrence?: string | null`
- `recurrenceId?: string | null`

### Category
- `id: string`
- `label: string`
- `color: string`

### Setting
- `key: string`
- `value: string`

### MediaFile
- `id: string`
- `milestoneId: string`
- `kind: string`
- `originalName: string`
- `mimeType: string`
- `sizeBytes: number`
- `storagePath: string`
- `sha256: string`
- `createdAt: string`

### BackupBundle
- `version: string`
- `exportedAt: string`
- `milestones: Milestone[]`
- `categories: Category[]`
- `settings: Setting[]`
- `mediaFiles: Array<MediaFile & { dataBase64: string }>`
