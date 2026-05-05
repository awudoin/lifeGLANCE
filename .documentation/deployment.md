# Deployment

This project is deployed as two separate containers:

- `frontend`
  - Serves the built Vite app through nginx
  - Proxies `/api/*` requests to the backend container
- `api`
  - Runs the Node/Express backend
  - Stores SQLite data and media files on a persistent volume

## Files

- Frontend container: [Dockerfile](/home/awudoin/projects/lifeGLANCE/Dockerfile:1)
- Backend container: [server/Dockerfile](/home/awudoin/projects/lifeGLANCE/server/Dockerfile:1)
- Compose file: [docker-compose.yml](/home/awudoin/projects/lifeGLANCE/docker-compose.yml:1)
- Frontend proxy config: [nginx.conf](/home/awudoin/projects/lifeGLANCE/nginx.conf:1)
- Backend runtime config: [server/src/config.ts](/home/awudoin/projects/lifeGLANCE/server/src/config.ts:1)
- Backend example env: [server/.env.example](/home/awudoin/projects/lifeGLANCE/server/.env.example:1)

## Default Runtime Shape

`docker-compose.yml` defines:

- `frontend`
  - exposed on host port `6868`
  - internally serves on port `80`
- `api`
  - internally serves on port `3001`
  - not exposed directly to the host by default
  - reachable from nginx as `http://api:3001`

The frontend is available at:

- `http://localhost:6868`

The backend is called through the frontend proxy:

- `http://localhost:6868/api/...`

## Persistent Data

The backend uses a named Docker volume:

- `lifeglance_data`

That volume is mounted at:

- `/data`

Inside the backend container:

- SQLite database path: `/data/app.db`
- Media directory: `/data/media`

This means milestone metadata, settings, categories, and uploaded files survive container restarts and rebuilds.

## Start The Stack

From the repo root:

```bash
docker compose up --build
```

To run detached:

```bash
docker compose up --build -d
```

To stop:

```bash
docker compose down
```

To stop without deleting persisted data:

- `docker compose down` is enough

To stop and also remove the named volume:

```bash
docker compose down -v
```

Be careful with `-v`: it deletes `/data/app.db` and `/data/media`.

## Validate Compose

Before first startup, it is useful to validate the resolved compose config:

```bash
docker compose config
```

## Rebuild After Code Changes

If you change either app:

```bash
docker compose up --build
```

If you want a full rebuild without cache:

```bash
docker compose build --no-cache
docker compose up
```

## Environment Variables

The backend supports these runtime values:

- `DATABASE_URL`
- `MEDIA_ROOT`
- `PORT`
- `CORS_ORIGIN`

The compose file currently sets:

- `DATABASE_URL=/data/app.db`
- `MEDIA_ROOT=/data/media`
- `PORT=3001`
- `CORS_ORIGIN=http://localhost:6868`

These are the right defaults for the compose deployment.

## Healthchecks

`docker-compose.yml` defines healthchecks for both services:

- `api`
  - checks `http://127.0.0.1:3001/api/health`
  - runs inside the backend container with Node
- `frontend`
  - checks `http://127.0.0.1/api/health`
  - verifies nginx is up and can proxy to the backend

The frontend service also waits for the backend to become healthy before starting through:

- `depends_on: condition: service_healthy`

You can inspect service health with:

```bash
docker compose ps
```

## Overriding Ports

To change the frontend host port, update:

- [docker-compose.yml](/home/awudoin/projects/lifeGLANCE/docker-compose.yml:1)

Example:

```yaml
ports:
  - "8080:80"
```

If you change the host port, also update:

- `CORS_ORIGIN`

Example:

```yaml
CORS_ORIGIN: http://localhost:8080
```

## Accessing The API Directly

The compose file does not publish the backend port by default.

That is intentional:

- frontend traffic should flow through nginx
- same-origin `/api` requests avoid extra browser CORS complexity

If you want direct host access for debugging, you can temporarily add:

```yaml
ports:
  - "3001:3001"
```

to the `api` service.

## Frontend API Routing

Production frontend behavior:

- client code uses same-origin `/api`
- nginx proxies `/api/*` to `http://api:3001`

Development frontend behavior:

- Vite proxies `/api/*` to `http://127.0.0.1:3001`

This is configured in:

- [src/data/apiClient.ts](/home/awudoin/projects/lifeGLANCE/src/data/apiClient.ts:1)
- [vite.config.js](/home/awudoin/projects/lifeGLANCE/vite.config.js:1)
- [nginx.conf](/home/awudoin/projects/lifeGLANCE/nginx.conf:1)

## Upload Limits

nginx is configured with:

- `client_max_body_size 1g`

This is required so media uploads can pass through the frontend proxy without being rejected too early.

If you plan to support larger uploads, raise that value in [nginx.conf](/home/awudoin/projects/lifeGLANCE/nginx.conf:1).

The backend also enforces a matching upload ceiling in the media route:

- current multer file size limit: `1 GiB`

Very large uploads are staged to disk in the backend container before being moved into the persistent media directory, rather than being buffered entirely in memory.

## Health Checks

The backend health endpoint is:

- `/api/health`

Through the frontend:

- `http://localhost:6868/api/health`

Expected response:

```json
{ "ok": true }
```

## Troubleshooting

If the frontend loads but API calls fail:

1. Check the backend container logs:

```bash
docker compose logs api
```

2. Check the frontend/nginx logs:

```bash
docker compose logs frontend
```

3. Verify health:

```bash
curl http://localhost:6868/api/health
```

If you suspect a bad database or media state and want a clean local deployment:

```bash
docker compose down -v
docker compose up --build
```

That removes all persisted backend data.

## Updating Images

This repo currently builds images locally from source via compose.

If you later publish images to a registry, you can switch the compose services from `build:` to `image:` references while keeping the same volume and env layout.

## Recommended First Deploy Test

After bringing the stack up:

1. Open `http://localhost:6868`
2. Create a milestone
3. Upload an image or media file
4. Change a setting and add a custom category
5. Reload the page
6. Confirm the milestone, media, settings, and category persist
7. Optionally restart the stack and verify persistence again
