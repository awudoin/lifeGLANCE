# Upgrade Plan
Currently this project stores is a frontend only application and stores all data in the browser with IndexedDB (data) and localStorage (settings). We will be creating a backend NodeJS project and adding a persistent database storage

## Step 1 - Create backend project
- Add a new server/ NodeJS app
- Use minimal stack (e.g. express or fastify)
- Add Drizzle, SQLite driver, migrations, and multipart upload support
- Add env based config
  - `DATABASE_URL`
  - `MEDIA_ROOT`
  - `PORT`
  - `CORS_ORIGIN`

## Step 2 - Define the database schema
- Working definition is in database.md
- This file may be modified as needed
- This file should always stay up-to-date with the current model

## Step 3 - Define API routes
- Working definition is in api.md
- This file may be modified as needed
- This file should always stay up-to-date with the current model

## Step 4 - Introduce frontend data-access layer
- Create a small client abstraction and stop importing storage helpers directly in UI code
- Suggested modules:
  - `src/data/apiClient.ts`
  - `src/data/milestonesApi.ts`
  - `src/data/settingsApi.ts`
  - `src/data/mediaApi.ts`
- This should replace:
  -  `src/data/db.js`
  - Direct calls inside `src/data/milestones.js`
  - Scattered localStorage read/writes inside `TimelineView`, `colors.js`, and `audio.js`

## Step 5 - Refactor milestone persistence
- Replace app startup in `src/App.jsx` with API call `GET /api/bootstrap`
- Replace `addMilestone`, `updateMilestone`, `deleteMilestone`, and `restoreMilestones` so they call the API endpoints
- Keep the existing React state flow initially so UI behavior remains stable

## Step 6 - Refactor media handling
- Replace IndexedDB media storage with uploaded files
- Replace
  - `dbPutMedia` usage in `TimelineView.jsx`
  - `dbGetMedia` usage in `Timeline.jsx`
  - `dbGetMedia` usage in `MilestoneDetail.jsx`
- Frontend flow:
  - Create or update milestone metadata
  - Upload attachment file
  - Receive `media_file` record
  - Display using `/api/media/:id`
- Replace base64 photo storage in `AddMilestoneSheet.jsx` with file upload too

## Step 7 - Move settings and categories to backend
- Current browser-only settings
  - Text size
  - Clustering
  - Birthday
  - Sound
  - Custom Categories
- They live/used in:
  - `TimelineView.jsx`
  - `colors.js`
  - `audio.js`
  - `SettingsModal.jsx`
- Plan of Action
  - Load settings from (`/api/bootstrap`) or (`/api/settings` and `/api/categories`) during bootstrap
  - Persist changes via API
- Use localStorage as cache for settings, if needed

## Step 8 - Add local-data migration path
- On first launch of new version:
  - Check for IndexedDB/localStorage data
  - Check if migration complete flag is set in database (maybe in settings table??)
- If data is present and migration hasn't been completed:
  - Ask user if they want to perform a 1-time import of local data
- If user wants to import data:
  - Read milestones from current IndexedDB
  - Read settings/categories from localStorage
  - Upload data/settings/categories to backend via API
  - Upload media from IndexedDB to media store
  - Mark migration complete in backend

## Step 9 - Redesign backup/restore
- Backup currently doesn't properly backup media now that it is stored in filesystem
- Change backup to export a JSON manifest with attached media.
  - Phase 4 implementation uses a single JSON backup bundle with embedded base64 media payloads
  - Zip streaming can be added later if the backup size or UX warrants it
- If it'll help, zipping the content can happen in the background and the user can be notified when it's available for download.

## Step 10 - Deployment changes
- Two separate containers:
  - Backend/API
  - Frontend
- Shared persistent volumes for both
  - `/data/app.db`
  - `/data/media`

# Implementation Plan
## Phase 1
- Add backend scaffold
- Add Drizzle schema and migrations
- Add API endpoints

## Phase 2
- Refactor frontend to use API for metadata only
- Leave media temporarily local

## Phase 3
- Move media/files to backend
- Remove IndexedDB media reads

## Phase 4
- Add local browser-to-backend migration
- Add updated backup/restore flow

## Phase 5
- Add local cache support

## Phase 6
- Add auth/multi-user support
- 
