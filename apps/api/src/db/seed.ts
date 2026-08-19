import { Pool } from "pg";
import { config } from "../config";

export const SEED_WORKERS = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Alex Rivera" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Jordan Chen" },
  { id: "33333333-3333-4333-8333-333333333333", name: "Sam Okonkwo" },
] as const;

const JOBS = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    title: "Replace rooftop HVAC filter",
    description: "Building B, unit 12. Customer reported weak airflow.",
    address: "14 Harbor St, Oakland",
    workerId: SEED_WORKERS[0].id,
    status: "ASSIGNED",
    events: [{ to: "ASSIGNED", actor: "dispatcher-1", note: "Created and assigned" }],
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    title: "Deliver spare pump to site 9",
    description: "Leave with site supervisor if worker is not on site.",
    address: "88 Pine Ave, Berkeley",
    workerId: SEED_WORKERS[0].id,
    status: "EN_ROUTE",
    events: [
      { to: "ASSIGNED", actor: "dispatcher-1", note: "Morning dispatch" },
      { to: "EN_ROUTE", actor: SEED_WORKERS[0].id, note: "Left the yard" },
    ],
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    title: "Inspect water heater leak",
    description: "Customer says drip started overnight.",
    address: "201 Mission Rd, San Francisco",
    workerId: SEED_WORKERS[1].id,
    status: "ON_SITE",
    events: [
      { to: "ASSIGNED", actor: "dispatcher-1" },
      { to: "EN_ROUTE", actor: SEED_WORKERS[1].id },
      { to: "ON_SITE", actor: SEED_WORKERS[1].id, note: "Met tenant in lobby" },
    ],
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    title: "Install smart thermostat",
    description: null,
    address: "5 Oak Ct, Alameda",
    workerId: SEED_WORKERS[1].id,
    status: "COMPLETED",
    events: [
      { to: "ASSIGNED", actor: "dispatcher-1" },
      { to: "EN_ROUTE", actor: SEED_WORKERS[1].id },
      { to: "ON_SITE", actor: SEED_WORKERS[1].id },
      { to: "COMPLETED", actor: SEED_WORKERS[1].id, note: "Unit paired, customer signed" },
    ],
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
    title: "Pickup failed delivery retry",
    description: "Recipient was not home on first attempt.",
    address: "77 Cedar Ln, Richmond",
    workerId: SEED_WORKERS[2].id,
    status: "CANCELED",
    events: [
      { to: "ASSIGNED", actor: "dispatcher-1" },
      { to: "CANCELED", actor: "dispatcher-1", note: "Customer asked to reschedule next week" },
    ],
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6",
    title: "Meter reading — warehouse 3",
    description: "Quarterly reading, no parts expected.",
    address: "400 Industrial Way, Hayward",
    workerId: SEED_WORKERS[2].id,
    status: "ASSIGNED",
    events: [{ to: "ASSIGNED", actor: "dispatcher-1" }],
  },
] as const;

const EXTRA_ASSIGNED_COUNT = 22;

function extraAssignedJobs() {
  return Array.from({ length: EXTRA_ASSIGNED_COUNT }, (_, index) => {
    const n = index + 1;
    return {
      id: `bbbbbbbb-bbbb-4bbb-8bbb-${String(n).padStart(12, "0")}`,
      title: `Queued inspection ${String(n).padStart(2, "0")}`,
      description: "Seeded so the Assigned column has more than one page on the board.",
      address: `${100 + n} Demo St, Oakland`,
      workerId: SEED_WORKERS[0].id,
      status: "ASSIGNED" as const,
      events: [{ to: "ASSIGNED" as const, actor: "dispatcher-1" }],
    };
  });
}

const SEEDED_JOBS = [...JOBS, ...extraAssignedJobs()];

export async function seed(connectionString = config.databaseUrl): Promise<void> {
  const pool = new Pool({ connectionString });
  try {
    for (const worker of SEED_WORKERS) {
      await pool.query(
        `INSERT INTO workers (id, name)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [worker.id, worker.name],
      );
    }

    for (const job of SEEDED_JOBS) {
      await pool.query(
        `INSERT INTO jobs (id, title, description, address, worker_id, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [job.id, job.title, job.description, job.address, job.workerId, job.status],
      );

      const existingEvents = await pool.query(
        "SELECT 1 FROM job_events WHERE job_id = $1 LIMIT 1",
        [job.id],
      );
      if ((existingEvents.rowCount ?? 0) > 0) {
        continue;
      }

      let fromStatus: string | null = null;
      for (const event of job.events) {
        const actorType = event.actor === "dispatcher-1" ? "DISPATCHER" : "WORKER";
        await pool.query(
          `INSERT INTO job_events (
             id, job_id, from_status, to_status, actor_type, actor_id, note
           ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
          [job.id, fromStatus, event.to, actorType, event.actor, "note" in event ? event.note ?? null : null],
        );
        fromStatus = event.to;
      }
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log("Seed data applied");
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
