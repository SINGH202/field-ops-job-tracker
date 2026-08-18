import {
  CreateJobRequest,
  JobWithEvents,
  ListJobsQuery,
  TransitionJobRequest,
} from "@field-ops/contracts";
import { randomUUID } from "node:crypto";
import { PoolClient } from "pg";
import { assertLegalTransition, isNoOpTransition } from "../domain/lifecycle";
import { IdempotencyConflictError, NotFoundError, ValidationError } from "../errors";
import { withTransaction } from "../db/pool";
import { decodeCursor, encodeCursor, hashRequestBody } from "../http/codec";
import {
  getIdempotencyRecord,
  insertIdempotencyRecord,
} from "../repos/idempotency";
import {
  getJobForUpdate,
  getJobWithEvents,
  insertEvent,
  insertJob,
  listJobs,
  updateJobStatus,
} from "../repos/jobs";
import { workerExists } from "../repos/workers";

type WriteResult = {
  statusCode: number;
  body: JobWithEvents;
  replayed: boolean;
};

async function replayOrStore(
  client: PoolClient,
  params: {
    key: string;
    method: string;
    path: string;
    requestHash: string;
    produce: () => Promise<{ statusCode: number; body: JobWithEvents }>;
  },
): Promise<WriteResult> {
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))", [
    params.key,
    "idempotency",
  ]);

  const existing = await getIdempotencyRecord(client, params.key);
  if (existing) {
    if (existing.requestHash !== params.requestHash) {
      throw new IdempotencyConflictError();
    }
    return {
      statusCode: existing.responseStatus,
      body: existing.responseBody as JobWithEvents,
      replayed: true,
    };
  }

  const produced = await params.produce();
  const inserted = await insertIdempotencyRecord(client, {
    key: params.key,
    method: params.method,
    path: params.path,
    requestHash: params.requestHash,
    responseStatus: produced.statusCode,
    responseBody: produced.body,
  });

  if (inserted === "conflict") {
    const raced = await getIdempotencyRecord(client, params.key);
    if (!raced) {
      throw new Error("Idempotency insert raced but record is missing");
    }
    if (raced.requestHash !== params.requestHash) {
      throw new IdempotencyConflictError();
    }
    return {
      statusCode: raced.responseStatus,
      body: raced.responseBody as JobWithEvents,
      replayed: true,
    };
  }

  return { ...produced, replayed: false };
}

export async function createJob(params: {
  idempotencyKey: string;
  body: CreateJobRequest;
}): Promise<WriteResult> {
  return withTransaction(async (client) => {
    return replayOrStore(client, {
      key: params.idempotencyKey,
      method: "POST",
      path: "/jobs",
      requestHash: hashRequestBody(params.body),
      produce: async () => {
        if (!(await workerExists(client, params.body.workerId))) {
          throw new NotFoundError("Worker", params.body.workerId);
        }
        const jobId = randomUUID();
        await insertJob(client, {
          id: jobId,
          title: params.body.title,
          description: params.body.description ?? null,
          address: params.body.address ?? null,
          workerId: params.body.workerId,
          status: "ASSIGNED",
        });
        await insertEvent(client, {
          id: randomUUID(),
          jobId,
          fromStatus: null,
          toStatus: "ASSIGNED",
          actorType: "DISPATCHER",
          actorId: params.body.actorId,
          note: null,
        });
        const created = await getJobWithEvents(client, jobId);
        if (!created) {
          throw new Error("Created job could not be loaded");
        }
        return { statusCode: 201, body: created };
      },
    });
  });
}

export async function transitionJob(params: {
  jobId: string;
  idempotencyKey: string;
  body: TransitionJobRequest;
}): Promise<WriteResult> {
  return withTransaction(async (client) => {
    return replayOrStore(client, {
      key: params.idempotencyKey,
      method: "POST",
      path: `/jobs/${params.jobId}/transitions`,
      requestHash: hashRequestBody({ jobId: params.jobId, ...params.body }),
      produce: async () => {
        const job = await getJobForUpdate(client, params.jobId);
        if (!job) {
          throw new NotFoundError("Job", params.jobId);
        }

        assertLegalTransition(job.status, params.body.toStatus);

        if (!isNoOpTransition(job.status, params.body.toStatus)) {
          await updateJobStatus(client, job.id, params.body.toStatus);
          await insertEvent(client, {
            id: randomUUID(),
            jobId: job.id,
            fromStatus: job.status,
            toStatus: params.body.toStatus,
            actorType: params.body.actorType,
            actorId: params.body.actorId,
            note: params.body.note ?? null,
          });
        }

        const updated = await getJobWithEvents(client, job.id);
        if (!updated) {
          throw new Error("Updated job could not be loaded");
        }
        return { statusCode: 200, body: updated };
      },
    });
  });
}

export async function listJobsPage(query: ListJobsQuery) {
  return withTransaction(async (client) => {
    let cursor: { updatedAt: string; id: string } | undefined;
    if (query.cursor) {
      try {
        cursor = decodeCursor(query.cursor);
      } catch {
        throw new ValidationError("cursor is invalid");
      }
    }

    const rows = await listJobs(client, {
      workerId: query.workerId,
      status: query.status,
      limit: query.limit + 1,
      cursor,
    });
    const hasMore = rows.length > query.limit;
    const data = hasMore ? rows.slice(0, query.limit) : rows;
    const last = data[data.length - 1];
    return {
      data,
      nextCursor: hasMore && last ? encodeCursor(last.updatedAt, last.id) : null,
    };
  });
}

export async function getJob(jobId: string): Promise<JobWithEvents> {
  return withTransaction(async (client) => {
    const job = await getJobWithEvents(client, jobId);
    if (!job) {
      throw new NotFoundError("Job", jobId);
    }
    return job;
  });
}
