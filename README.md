# Field Ops Job Tracker

Dispatcher-facing job tracker for field work: a Node.js/TypeScript API with Postgres, shared Zod contracts, and a Next.js board. Mobile is intentionally out of scope (see [DECISIONS.md](./DECISIONS.md)).

## Prerequisites

- Node.js 20+
- npm 10+ (ships with Node 20)
- Docker with Compose v2

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

Open [http://localhost:3000](http://localhost:3000).

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

The dispatcher UI does not require login. Writes from the web app send `actorId: dispatcher-1`.

Seeded jobs cover every lifecycle state, including a canceled job and a completed job with a full event history.

## API sketch

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/jobs?workerId&status&limit&cursor` | Cursor-paginated; not a full dump |
| `GET` | `/jobs/:id` | Job plus chronological event timeline |
| `POST` | `/jobs` | Create and assign. Requires `Idempotency-Key` |
| `POST` | `/jobs/:id/transitions` | Advance or cancel. Requires `Idempotency-Key` |
| `GET` | `/workers` | For the assign form |

Lifecycle (server-enforced): `ASSIGNED → EN_ROUTE → ON_SITE → COMPLETED`. `CANCELED` is allowed from any non-terminal state.

## Layout

```
packages/contracts   shared Zod schemas + TS types (source of truth)
apps/api             Express API, SQL migrations, tests
apps/web             Next.js dispatcher dashboard
```
