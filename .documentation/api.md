# API routes defined in the backend project

| Endpoint | Method | Arguments | Returns | Comments |
|----------|--------|-----------|---------|----------|
| `api/bootstrap` | GET | None | milestones, categories, settings | Reduces frontend startup round-trips by sending all data |
| `api/milestones` | GET | | | |
| `api/milestones` | POST | | | |
| `api/milestones/:id` | PUT | | | |
| `api/milestones/:id` | DELETE | | | |
| `api/recurrences/:recurrenceId` | DELETE | | | |
| `api/milestones/import/ics` | POST | | | Optional for server-side ICS parsing |
| `api/milestones/restore` | POST | | | Replace all milestone data from backup |
| `api/categories` | GET | | | |
| `api/categories` | PUT | | | |
| `/api/settings` | GET | | | |
| `/api/settings` | PUT | | | |
| `api/media` | POST | | | Multipart upload with milestoneID and kind |
| `api/media/:id` | GET | | | Streams file back to client |
| `api/media/:id` | DELETE | | | |