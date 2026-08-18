"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Job, JobStatus, Worker } from "@field-ops/contracts";
import { Typography } from "../components/Typography";
import { listJobs, listWorkers } from "../lib/api";
import { BOARD_STATUSES, STATUS_LABEL, formatTimestamp } from "../lib/status";

const POLL_MS = 4000;

export default function BoardPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [jobsByStatus, setJobsByStatus] = useState<Record<JobStatus, Job[]>>({
    ASSIGNED: [],
    EN_ROUTE: [],
    ON_SITE: [],
    COMPLETED: [],
    CANCELED: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listWorkers(controller.signal)
      .then(setWorkers)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load workers");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function refresh() {
      try {
        const entries = await Promise.all(
          BOARD_STATUSES.map(async (status) => {
            const jobs = await listJobs(
              { status, workerId: workerId || undefined, limit: 50 },
              controller.signal,
            );
            return [status, jobs] as const;
          }),
        );
        setJobsByStatus(Object.fromEntries(entries) as Record<JobStatus, Job[]>);
        setError(null);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [workerId]);

  return (
    <div>
      <div className="toolbar">
        <div>
          <Typography variant="h2">Dispatcher board</Typography>
          <Typography variant="small">
            Polls every 4 seconds. Filter by worker if you want a single route.
          </Typography>
        </div>
        <label className="field">
          <Typography variant="small">Worker</Typography>
          <select value={workerId} onChange={(event) => setWorkerId(event.target.value)}>
            <option value="">All workers</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <Typography variant="bodyMedium" className="error">
          {error}. Is the API running on port 3001?
        </Typography>
      ) : null}

      <div className="board">
        {BOARD_STATUSES.map((status) => (
          <section key={status} className="column">
            <div className="column-header">
              <Typography variant="h3">{STATUS_LABEL[status]}</Typography>
              <Typography variant="small">{jobsByStatus[status].length}</Typography>
            </div>
            <div className="column-body">
              {loading && jobsByStatus[status].length === 0 ? (
                <Typography variant="small">Loading…</Typography>
              ) : null}
              {!loading && jobsByStatus[status].length === 0 ? (
                <Typography variant="small" className="empty">
                  No jobs
                </Typography>
              ) : null}
              {jobsByStatus[status].map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="card">
                  <Typography variant="h3">{job.title}</Typography>
                  <div className="card-meta">
                    <Typography variant="small">
                      {workers.find((worker) => worker.id === job.workerId)?.name ?? "Unknown worker"}
                    </Typography>
                    <Typography variant="small">{job.address ?? "No address"}</Typography>
                    <Typography variant="small">{formatTimestamp(job.updatedAt)}</Typography>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
