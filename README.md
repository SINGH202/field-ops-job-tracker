# Field Ops Job Tracker

Dispatcher-facing job tracker for field work: a Node.js/TypeScript API with Postgres, shared Zod contracts, a Next.js board, and an optional Expo worker app for Android.

## Prerequisites

- Node.js 20+
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

Open [http://localhost:3000](http://localhost:3000). On the create form, submit with **Create and assign** (the header **New job** link only navigates to the form). The web app proxies `/backend/*` to the API so browser calls stay same-origin.

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

Keep the API running on port 3001. Start an Android emulator (or plug in a phone with USB debugging), then:

```bash
npm run dev:mobile
```

In the Expo terminal, press `a` to open the app on Android. The app calls `http://10.0.2.2:3001` (the emulator’s alias for the host). Pick a seeded worker — there is no password — then open a job and advance its status.

If Expo says no device was found, the emulator is not running. On this Mac, Android Studio’s SDK is typically at `~/Library/Android/sdk` but is not on `PATH` until you export it:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
emulator -list-avds          # e.g. Pixel_7_API_35
emulator -avd Pixel_7_API_35
```

Wait until the emulator home screen appears, then run `npm run dev:mobile` again and press `a`.

On a physical device, install Expo Go, copy `apps/mobile/.env.example` to `apps/mobile/.env`, set `EXPO_PUBLIC_API_URL` to `http://<your-lan-ip>:3001`, then scan the QR code from `npm run dev:mobile`.

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

Lifecycle (server-enforced): `ASSIGNED → EN_ROUTE → ON_SITE → COMPLETED`. `CANCELED` is allowed from any non-terminal state.

## Layout

```
packages/contracts   shared Zod schemas + TS types (source of truth)
apps/api             Express API, SQL migrations, tests
apps/web             Next.js dispatcher dashboard
apps/mobile          Expo worker app (Android)
```
