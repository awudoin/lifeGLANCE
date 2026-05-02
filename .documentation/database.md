# Current Database Schema
## Database Version: 1
## Current Database: SQLite

## Database conventions
- Avoid SQLite specific column types
- Make as compatible with PostgreSQL, MariaDB, MySQL as possible. Possible migration in the future.

**Table: milestones**
- id
- title
- date
- datePrecision
- direction
- categoryId
- color
- note
- url
- recurrence
- recurrenceId
- createdAt
- updatedAt
- indexes on `date`, `categoryId`, and `recurrenceId`

**Table: categories**
- id
- label
- color
- createdAt
- updatedAt

**Table: settings**
- key
- value
- updatedAt

**Table: media_files**
- id
- milestoneId
- kind (e.g. image/audio/video)
- originalName
- mimeType
- sizeBytes
- storagePath
- sha256
- createdAt
- index on `milestoneId`
- composite index on `milestoneId` + `kind`

**Table: schema_metadata**
- namespace
- key
- value
- updatedAt
