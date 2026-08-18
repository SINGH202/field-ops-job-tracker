import { beforeAll, beforeEach } from "vitest";
import { Pool } from "pg";
import { config } from "../src/config";
import { migrate } from "../src/db/migrate";
import { getPool, setPool } from "../src/db/pool";

export const WORKER_A = "11111111-1111-4111-8111-111111111111";
export const WORKER_B = "22222222-2222-4222-8222-222222222222";
export const UNKNOWN_WORKER = "99999999-9999-4999-8999-999999999999";

beforeAll(async () => {
  await migrate(config.testDatabaseUrl);
  setPool(new Pool({ connectionString: config.testDatabaseUrl }));
});

beforeEach(async () => {
  const pool = getPool();
  await pool.query(
    "TRUNCATE job_events, jobs, idempotency_keys, workers RESTART IDENTITY CASCADE",
  );
  await pool.query(
    `INSERT INTO workers (id, name) VALUES ($1, $2), ($3, $4)`,
    [WORKER_A, "Alex Rivera", WORKER_B, "Jordan Chen"],
  );
});
