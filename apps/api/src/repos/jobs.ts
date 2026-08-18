import { Job, JobEvent, JobStatus, JobWithEvents } from "@field-ops/contracts";
import { PoolClient } from "pg";

type JobRow = {
  id: string;
  title: string;
  description: string | null;
  address: string | null;
  worker_id: string;
  status: JobStatus;
  created_at: Date;
  updated_at: Date;
};

type EventRow = {
  id: string;
  job_id: string;
  from_status: JobStatus | null;
  to_status: JobStatus;
  actor_type: JobEvent["actorType"];
  actor_id: string;
  note: string | null;
  occurred_at: Date;
};

export type ListJobsParams = {
  workerId?: string;
  status?: JobStatus;
  limit: number;
  cursor?: { updatedAt: string; id: string };
};

export function mapJob(row: JobRow): Job {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    address: row.address,
    workerId: row.worker_id,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function mapEvent(row: EventRow): JobEvent {
  return {
    id: row.id,
    jobId: row.job_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    actorType: row.actor_type,
    actorId: row.actor_id,
    note: row.note,
    occurredAt: row.occurred_at.toISOString(),
  };
}

export async function listJobs(
  client: PoolClient,
  params: ListJobsParams,
): Promise<Job[]> {
  const values: unknown[] = [];
  const where: string[] = [];

  if (params.workerId) {
    values.push(params.workerId);
    where.push(`worker_id = $${values.length}`);
  }
  if (params.status) {
    values.push(params.status);
    where.push(`status = $${values.length}`);
  }
  if (params.cursor) {
    values.push(params.cursor.updatedAt, params.cursor.id);
    where.push(
      `(updated_at, id) < ($${values.length - 1}::timestamptz, $${values.length}::uuid)`,
    );
  }

  values.push(params.limit);
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const result = await client.query<JobRow>(
    `SELECT id, title, description, address, worker_id, status, created_at, updated_at
     FROM jobs
     ${whereSql}
     ORDER BY updated_at DESC, id DESC
     LIMIT $${values.length}`,
    values,
  );
  return result.rows.map(mapJob);
}

export async function getJobForUpdate(
  client: PoolClient,
  jobId: string,
): Promise<Job | null> {
  const result = await client.query<JobRow>(
    `SELECT id, title, description, address, worker_id, status, created_at, updated_at
     FROM jobs
     WHERE id = $1
     FOR UPDATE`,
    [jobId],
  );
  return result.rows[0] ? mapJob(result.rows[0]) : null;
}

export async function getJobById(client: PoolClient, jobId: string): Promise<Job | null> {
  const result = await client.query<JobRow>(
    `SELECT id, title, description, address, worker_id, status, created_at, updated_at
     FROM jobs
     WHERE id = $1`,
    [jobId],
  );
  return result.rows[0] ? mapJob(result.rows[0]) : null;
}

export async function listEventsForJob(
  client: PoolClient,
  jobId: string,
): Promise<JobEvent[]> {
  const result = await client.query<EventRow>(
    `SELECT id, job_id, from_status, to_status, actor_type, actor_id, note, occurred_at
     FROM job_events
     WHERE job_id = $1
     ORDER BY occurred_at ASC, id ASC`,
    [jobId],
  );
  return result.rows.map(mapEvent);
}

export async function getJobWithEvents(
  client: PoolClient,
  jobId: string,
): Promise<JobWithEvents | null> {
  const job = await getJobById(client, jobId);
  if (!job) {
    return null;
  }
  const events = await listEventsForJob(client, jobId);
  return { ...job, events };
}

export async function insertJob(
  client: PoolClient,
  job: {
    id: string;
    title: string;
    description: string | null;
    address: string | null;
    workerId: string;
    status: JobStatus;
  },
): Promise<Job> {
  const result = await client.query<JobRow>(
    `INSERT INTO jobs (id, title, description, address, worker_id, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, description, address, worker_id, status, created_at, updated_at`,
    [job.id, job.title, job.description, job.address, job.workerId, job.status],
  );
  return mapJob(result.rows[0]);
}

export async function updateJobStatus(
  client: PoolClient,
  jobId: string,
  status: JobStatus,
): Promise<void> {
  await client.query(
    `UPDATE jobs
     SET status = $2, updated_at = now()
     WHERE id = $1`,
    [jobId, status],
  );
}

export async function insertEvent(
  client: PoolClient,
  event: {
    id: string;
    jobId: string;
    fromStatus: JobStatus | null;
    toStatus: JobStatus;
    actorType: JobEvent["actorType"];
    actorId: string;
    note: string | null;
  },
): Promise<JobEvent> {
  const result = await client.query<EventRow>(
    `INSERT INTO job_events (
       id, job_id, from_status, to_status, actor_type, actor_id, note
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, job_id, from_status, to_status, actor_type, actor_id, note, occurred_at`,
    [
      event.id,
      event.jobId,
      event.fromStatus,
      event.toStatus,
      event.actorType,
      event.actorId,
      event.note,
    ],
  );
  return mapEvent(result.rows[0]);
}
