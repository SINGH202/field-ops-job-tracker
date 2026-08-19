import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { HealthResponseSchema, JobWithEvents } from "@field-ops/contracts";
import { createApp } from "../src/app";
import { UNKNOWN_WORKER, WORKER_A, WORKER_B } from "./setup";

const app = createApp();

function createJob(overrides: Record<string, unknown> = {}, key = randomUUID()) {
  return request(app)
    .post("/jobs")
    .set("Idempotency-Key", key)
    .send({
      title: "Inspect panel",
      workerId: WORKER_A,
      actorId: "dispatcher-1",
      ...overrides,
    });
}

async function createAssignedJob(): Promise<JobWithEvents> {
  const res = await createJob();
  expect(res.status).toBe(201);
  return res.body as JobWithEvents;
}

describe("POST /jobs", () => {
  it("creates a job in ASSIGNED with an initial event", async () => {
    const res = await createJob({
      title: "Fix leak",
      description: "Kitchen sink",
      address: "1 Main St",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("ASSIGNED");
    expect(res.body.workerId).toBe(WORKER_A);
    expect(res.body.title).toBe("Fix leak");
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0]).toMatchObject({
      fromStatus: null,
      toStatus: "ASSIGNED",
      actorType: "DISPATCHER",
      actorId: "dispatcher-1",
    });
  });

  it("rejects invalid bodies at the API edge", async () => {
    const res = await createJob({ title: "", workerId: "not-a-uuid" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("requires an Idempotency-Key on writes", async () => {
    const res = await request(app).post("/jobs").send({
      title: "No key",
      workerId: WORKER_A,
      actorId: "dispatcher-1",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_IDEMPOTENCY_KEY");
  });

  it("returns 404 when the assigned worker does not exist", async () => {
    const res = await createJob({ workerId: UNKNOWN_WORKER });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("replays the same create when the idempotency key is retried", async () => {
    const key = randomUUID();
    const first = await createJob({ title: "Retry me" }, key);
    const second = await createJob({ title: "Retry me" }, key);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);

    const listed = await request(app).get("/jobs");
    expect(listed.body.data).toHaveLength(1);
  });

  it("serializes concurrent retries with the same key into a single job", async () => {
    const key = randomUUID();
    const [first, second] = await Promise.all([
      createJob({ title: "Concurrent" }, key),
      createJob({ title: "Concurrent" }, key),
    ]);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.id).toBe(second.body.id);

    const listed = await request(app).get("/jobs");
    expect(listed.body.data).toHaveLength(1);
  });

  it("rejects reusing an idempotency key with a different body", async () => {
    const key = randomUUID();
    await createJob({ title: "Original" }, key);
    const res = await createJob({ title: "Different" }, key);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("IDEMPOTENCY_KEY_REUSED");
  });
});

describe("GET /jobs and GET /jobs/:id", () => {
  it("filters by worker and by status", async () => {
    await createJob({ title: "A assigned", workerId: WORKER_A });
    const b = await createJob({ title: "B assigned", workerId: WORKER_B });
    await request(app)
      .post(`/jobs/${b.body.id}/transitions`)
      .set("Idempotency-Key", randomUUID())
      .send({ toStatus: "EN_ROUTE", actorType: "WORKER", actorId: WORKER_B });

    const byWorker = await request(app).get("/jobs").query({ workerId: WORKER_A });
    expect(byWorker.body.data).toHaveLength(1);
    expect(byWorker.body.data[0].title).toBe("A assigned");

    const byStatus = await request(app).get("/jobs").query({ status: "EN_ROUTE" });
    expect(byStatus.body.data).toHaveLength(1);
    expect(byStatus.body.data[0].title).toBe("B assigned");
  });

  it("paginates instead of dumping the full table", async () => {
    for (let i = 0; i < 3; i += 1) {
      await createJob({ title: `Job ${i}` });
    }

    const page1 = await request(app).get("/jobs").query({ limit: 2 });
    expect(page1.status).toBe(200);
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.nextCursor).toBeTruthy();

    const page2 = await request(app)
      .get("/jobs")
      .query({ limit: 2, cursor: page1.body.nextCursor });
    expect(page2.body.data).toHaveLength(1);
    expect(page2.body.nextCursor).toBeNull();

    const ids = [...page1.body.data, ...page2.body.data].map(
      (job: { id: string }) => job.id,
    );
    expect(new Set(ids).size).toBe(3);
  });

  it("returns a job with its full event timeline", async () => {
    const created = await createAssignedJob();
    await request(app)
      .post(`/jobs/${created.id}/transitions`)
      .set("Idempotency-Key", randomUUID())
      .send({
        toStatus: "EN_ROUTE",
        actorType: "WORKER",
        actorId: WORKER_A,
        note: "Rolling out",
      });

    const res = await request(app).get(`/jobs/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.events.map((event: { toStatus: string }) => event.toStatus)).toEqual([
      "ASSIGNED",
      "EN_ROUTE",
    ]);
    expect(res.body.events[1].note).toBe("Rolling out");
  });

  it("returns 404 for an unknown job", async () => {
    const res = await request(app).get(`/jobs/${randomUUID()}`);
    expect(res.status).toBe(404);
  });

  it("rejects an invalid cursor", async () => {
    const res = await request(app).get("/jobs").query({ cursor: "not-a-cursor" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /jobs/:id/transitions", () => {
  it("advances ASSIGNED → EN_ROUTE → ON_SITE → COMPLETED and records each event", async () => {
    const job = await createAssignedJob();
    const steps = ["EN_ROUTE", "ON_SITE", "COMPLETED"] as const;

    let current: JobWithEvents = job;
    for (const toStatus of steps) {
      const res = await request(app)
        .post(`/jobs/${current.id}/transitions`)
        .set("Idempotency-Key", randomUUID())
        .send({ toStatus, actorType: "WORKER", actorId: WORKER_A });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(toStatus);
      current = res.body;
    }

    expect(current.events.map((event: { toStatus: string }) => event.toStatus)).toEqual([
      "ASSIGNED",
      "EN_ROUTE",
      "ON_SITE",
      "COMPLETED",
    ]);
  });

  it("allows cancel from a non-terminal state", async () => {
    const job = await createAssignedJob();
    const res = await request(app)
      .post(`/jobs/${job.id}/transitions`)
      .set("Idempotency-Key", randomUUID())
      .send({
        toStatus: "CANCELED",
        actorType: "DISPATCHER",
        actorId: "dispatcher-1",
        note: "Customer postponed",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELED");
    expect(res.body.events.at(-1)).toMatchObject({
      fromStatus: "ASSIGNED",
      toStatus: "CANCELED",
      note: "Customer postponed",
    });
  });

  it("rejects illegal transitions on the server", async () => {
    const job = await createAssignedJob();
    const res = await request(app)
      .post(`/jobs/${job.id}/transitions`)
      .set("Idempotency-Key", randomUUID())
      .send({ toStatus: "COMPLETED", actorType: "WORKER", actorId: WORKER_A });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ILLEGAL_TRANSITION");

    const fetched = await request(app).get(`/jobs/${job.id}`);
    expect(fetched.body.status).toBe("ASSIGNED");
    expect(fetched.body.events).toHaveLength(1);
  });

  it("rejects transitions out of a terminal state", async () => {
    const job = await createAssignedJob();
    await request(app)
      .post(`/jobs/${job.id}/transitions`)
      .set("Idempotency-Key", randomUUID())
      .send({ toStatus: "CANCELED", actorType: "DISPATCHER", actorId: "dispatcher-1" });

    const res = await request(app)
      .post(`/jobs/${job.id}/transitions`)
      .set("Idempotency-Key", randomUUID())
      .send({ toStatus: "ASSIGNED", actorType: "DISPATCHER", actorId: "dispatcher-1" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ILLEGAL_TRANSITION");
  });

  it("does not duplicate events when a transition is retried with the same key", async () => {
    const job = await createAssignedJob();
    const key = randomUUID();
    const payload = {
      toStatus: "EN_ROUTE",
      actorType: "WORKER",
      actorId: WORKER_A,
      note: "On the way",
    };

    const first = await request(app)
      .post(`/jobs/${job.id}/transitions`)
      .set("Idempotency-Key", key)
      .send(payload);
    const second = await request(app)
      .post(`/jobs/${job.id}/transitions`)
      .set("Idempotency-Key", key)
      .send(payload);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
    expect(second.body.events.filter((event: { toStatus: string }) => event.toStatus === "EN_ROUTE")).toHaveLength(1);
  });

  it("is safe if a client retries the same target status without a stored key", async () => {
    const job = await createAssignedJob();
    await request(app)
      .post(`/jobs/${job.id}/transitions`)
      .set("Idempotency-Key", randomUUID())
      .send({ toStatus: "EN_ROUTE", actorType: "WORKER", actorId: WORKER_A });

    const retry = await request(app)
      .post(`/jobs/${job.id}/transitions`)
      .set("Idempotency-Key", randomUUID())
      .send({ toStatus: "EN_ROUTE", actorType: "WORKER", actorId: WORKER_A });

    expect(retry.status).toBe(200);
    expect(retry.body.status).toBe("EN_ROUTE");
    expect(retry.body.events.filter((event: { toStatus: string }) => event.toStatus === "EN_ROUTE")).toHaveLength(1);
  });
});

describe("GET /health", () => {
  it("reports that the process is up", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(HealthResponseSchema.parse(res.body)).toEqual({ ok: true });
  });
});

describe("GET /workers", () => {
  it("lists workers for the assign form", async () => {
    const res = await request(app).get("/workers");
    expect(res.status).toBe(200);
    expect(res.body.data.map((worker: { name: string }) => worker.name)).toEqual([
      "Alex Rivera",
      "Jordan Chen",
    ]);
  });

  it("returns JSON even when the client sends If-None-Match", async () => {
    const first = await request(app).get("/workers");
    const res = await request(app)
      .get("/workers")
      .set("If-None-Match", first.headers.etag ?? 'W/"cached"');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});
