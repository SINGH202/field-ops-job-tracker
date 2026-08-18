-- Access-pattern driven schema for the field ops job tracker.
-- See DECISIONS.md for why each index exists.

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM (
    'ASSIGNED',
    'EN_ROUTE',
    'ON_SITE',
    'COMPLETED',
    'CANCELED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE workers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT,
  worker_id UUID NOT NULL REFERENCES workers (id),
  status job_status NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dispatcher board: jobs in a given status, newest first, cursor-paginated.
CREATE INDEX jobs_status_updated_id_idx
  ON jobs (status, updated_at DESC, id DESC);

-- Worker view: a worker's jobs by status, newest first, cursor-paginated.
CREATE INDEX jobs_worker_status_updated_id_idx
  ON jobs (worker_id, status, updated_at DESC, id DESC);

CREATE TABLE job_events (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  from_status job_status,
  to_status job_status NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('DISPATCHER', 'WORKER')),
  actor_id TEXT NOT NULL,
  note TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job timeline: events for one job in chronological order.
CREATE INDEX job_events_job_id_occurred_idx
  ON job_events (job_id, occurred_at ASC, id ASC);

-- Retry-safety: one stored response per client-supplied key.
CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
