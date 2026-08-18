# Decisions

## Database: Postgres

The clients need three access patterns: a worker's jobs by status, a job plus its full event history, and a dispatcher board of all jobs grouped by status. Those are relational joins plus ordered, filtered lists. Writes need a transaction that updates the job, appends an event, and records an idempotency key together. Postgres is the tool I would actually reach for here.

Trade-off: we run a server (mitigated by Docker Compose). A document store would make the timeline easy to embed on the job, but listing "all EN_ROUTE jobs, newest first, paginated" becomes a custom index design, and retry-safe lifecycle updates are harder to make atomic. DynamoDB would be a reasonable production choice if this were already on AWS with huge write volume; it is the wrong local default for this exercise.

## Data model

**`workers`** — `id` (UUID PK), `name`. Looked up when creating a job and when rendering the assign form.

**`jobs`** — `id`, `title`, `description`, `address`, `worker_id`, `status`, timestamps.

- `jobs (status, updated_at DESC, id DESC)` — dispatcher column: jobs in one status, cursor-paginated.
- `jobs (worker_id, status, updated_at DESC, id DESC)` — worker view: that worker's jobs in one status, same cursor.

Cursor is `(updated_at, id)` encoded as base64url JSON. Queries fetch `limit + 1` to decide `nextCursor`. This is not offset pagination and not `SELECT * FROM jobs`.

**`job_events`** — append-only history: `job_id`, `from_status` (null on create), `to_status`, `actor_type`, `actor_id`, optional `note`, `occurred_at`. Index `(job_id, occurred_at, id)` serves `GET /jobs/:id`.

**`idempotency_keys`** — `key` PK, `request_hash`, stored HTTP status + JSON body. Write endpoints require `Idempotency-Key`.

Migrations are ordered SQL files applied once via `schema_migrations`. Schema is driven by the queries above, not by an ORM.

## Lifecycle and idempotency

Allowed edges live in `allowedTargets()` — a switch over `JobStatus` with a `never` default so a new status fails compilation until handled. Illegal transitions return `409 ILLEGAL_TRANSITION` and do not write an event. Same-status retries are no-ops: 200, no extra event. That covers a lost response where the client retries without the original key.

The write path, in one transaction:

1. `pg_advisory_xact_lock` on the idempotency key so concurrent retries serialize.
2. If the key exists with the same body hash, replay the stored response (including the original 201).
3. If the key exists with a different hash, `409 IDEMPOTENCY_KEY_REUSED`.
4. Otherwise lock the job row (`SELECT FOR UPDATE`), enforce the transition, update + insert event, store the key, commit.

Failed requests are not stored, so a validation error can be fixed and retried with the same key.

## Shared contracts

`@field-ops/contracts` is the only job/event/request/response shape. The API validates with those Zod schemas at the edge. The Next.js app imports the same types. No hand-copied interfaces.

## What I left out

**Mobile.** The brief marks it optional. A rushed Expo app would have cost time that belongs on tests and the write path.

**Auth.** Out of scope; dispatcher actor is `dispatcher-1`.

**Realtime.** Board polls every 4s as allowed.

**With more time:** persist pending idempotency keys with a TTL and recover crashed in-flight writes; add a worker-facing Expo client with an outbox for offline transitions; bound event lists if a job could accrue thousands of notes.
