# Field Ops Job Tracker

Dispatcher-facing job tracker for field work: a Node.js/TypeScript API with Postgres, shared Zod contracts, a Next.js board, and an optional Expo worker app for Android.

Live dispatcher board: [https://field-ops-job-tracker-web.vercel.app/](https://field-ops-job-tracker-web.vercel.app/)

## Prerequisites

- Node.js 20.9+
- npm 10+ (ships with Node 20)
- Docker with Compose v2
- For the worker app: Android Studio emulator (or a device with Expo Go) and the API running on port 3001

## Run locally

From a clean clone:

```bash
cp .env.example .env
npm install
docker compose up --build
```

Postgres is published on **host port 5433** (container 5432) so it does not collide with a local Postgres on 5432.

In a second terminal, start the dispatcher web app:

```bash
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000). On the create form, submit with **Create and assign** (the header **New job** link only navigates to the form). The web app proxies `/backend/*` to the API so browser calls stay same-origin. Next.js reads `API_PROXY_TARGET` from the **repo-root** `.env` at startup — restart `npm run dev:web` after changing it. The terminal should log `[web] proxy /backend → …`.

### Backend without the API container

If you want the API in watch mode on the host:

```bash
docker compose up -d postgres
npm install
npm run migrate
npm run seed
npm run dev:api
```

API: [http://localhost:3001](http://localhost:3001) · health check: `GET /health`

### Android worker app (Expo)

Keep the API on port 3001, start an Android emulator (or Expo Go on a device), then:

```bash
npm run dev:mobile
```

Press `a` in the Expo terminal. The emulator reaches the API at `http://10.0.2.2:3001`. Pick a seeded worker, open a job, and advance its status. If Expo cannot find a device, start an AVD from Android Studio first.

On a physical device, set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to `http://<lan-ip>:3001`.

## Tests

Needs Postgres running (`docker compose up -d postgres`). Tests use a separate database, `fieldops_test`, so they will not wipe the seeded demo data.

```bash
docker compose up -d postgres
npm install
npm test
```

## Demo data

Seeded workers (use these IDs anywhere a worker identity is needed):

| Name | Worker ID |
| --- | --- |
| Alex Rivera | `11111111-1111-4111-8111-111111111111` |
| Jordan Chen | `22222222-2222-4222-8222-222222222222` |
| Sam Okonkwo | `33333333-3333-4333-8333-333333333333` |

The dispatcher UI does not require login. Writes from the web app send `actorId: dispatcher-1`. The worker app sends `actorType: WORKER` and that worker’s id.

Seeded jobs cover every lifecycle state, including a canceled job and a completed job with a full event history. Assigned also includes extra queued jobs (Alex Rivera) so the board's **Load more** control appears — each column page is 20 jobs.

## API sketch

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/jobs?workerId&status&limit&cursor` | Cursor-paginated; not a full dump |
| `GET` | `/jobs/:id` | Job plus chronological event timeline |
| `POST` | `/jobs` | Create and assign. Requires `Idempotency-Key` |
| `POST` | `/jobs/:id/transitions` | Advance or cancel. Requires `Idempotency-Key` |
| `GET` | `/workers` | For the assign form and worker sign-in |

Lifecycle (server-enforced): `ASSIGNED → EN_ROUTE → ON_SITE → COMPLETED`. `CANCELED` is allowed from any non-terminal state. Canceling from the board (drop onto Canceled), job detail, or the worker app opens an in-app confirm dialog (`Keep job` / `Cancel job`).

## Layout

```
packages/contracts   shared Zod schemas + TS types (source of truth)
apps/api             Express API, SQL migrations, tests
apps/web             Next.js dispatcher dashboard
apps/mobile          Expo worker app (Android)
```

## Production

**API + Postgres** on [Render](https://render.com): free plans do not run Blueprints, so create services by hand. Postgres and a Docker web service (`apps/api/Dockerfile`, build context = repo root) must be in the same region. Set `DATABASE_URL` on the web service to the **internal** database URL. Health check: `GET /health`.

**Web** on [Vercel](https://vercel.com): [https://field-ops-job-tracker-web.vercel.app/](https://field-ops-job-tracker-web.vercel.app/). Root directory `apps/web` (install/build from the monorepo root via `vercel.json`). Env:

- `API_PROXY_TARGET` — public Render API URL (no trailing slash). This is a **build-time** rewrite; redeploy after changing it.
- `NEXT_PUBLIC_API_URL` — `/backend`

To point **local** Next.js at a hosted API, set those same keys in the repo-root `.env`, restart `npm run dev:web`, then `curl http://localhost:3000/backend/health`.

**Worker app:** `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to the public API URL.
