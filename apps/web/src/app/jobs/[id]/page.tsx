"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { JobStatus, JobWithEvents } from "@field-ops/contracts";
import { Typography } from "../../../components/Typography";
import { ApiError, getJob, listWorkers, transitionJob } from "../../../lib/api";
import { STATUS_LABEL, formatTimestamp } from "../../../lib/status";

const DISPATCHER_ID = "dispatcher-1";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<JobWithEvents | null>(null);
  const [workerName, setWorkerName] = useState<string>("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getJob(params.id, controller.signal)
      .then(setJob)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load job");
      });
    return () => controller.abort();
  }, [params.id]);

  useEffect(() => {
    if (!job) return;
    const controller = new AbortController();
    listWorkers(controller.signal)
      .then((workers) => {
        const worker = workers.find((item) => item.id === job.workerId);
        setWorkerName(worker?.name ?? job.workerId);
      })
      .catch(() => {
        setWorkerName(job.workerId);
      });
    return () => controller.abort();
  }, [job]);

  async function advance(toStatus: JobStatus) {
    if (!job) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await transitionJob(job.id, {
        toStatus,
        actorType: "DISPATCHER",
        actorId: DISPATCHER_ID,
        note: note || undefined,
      });
      setJob(updated);
      setNote("");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Transition failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!job && !error) {
    return <Typography variant="bodyMedium">Loading job…</Typography>;
  }

  if (!job) {
    return (
      <Typography variant="bodyMedium" className="error">
        {error}
      </Typography>
    );
  }

  return (
    <div className="stack">
      <div>
        <Typography variant="h2">{job.title}</Typography>
        <Typography variant="small" className={`badge badge-${job.status}`}>
          {STATUS_LABEL[job.status]}
        </Typography>
      </div>

      <div className="detail">
        <section className="panel stack">
          <Typography variant="h3">Job</Typography>
          <Typography variant="bodyMedium">{job.description ?? "No description"}</Typography>
          <Typography variant="small">Address: {job.address ?? "—"}</Typography>
          <Typography variant="small">Worker: {workerName}</Typography>
          <Typography variant="small">Updated {formatTimestamp(job.updatedAt)}</Typography>

          {job.status !== "COMPLETED" && job.status !== "CANCELED" ? (
            <>
              <label className="field">
                <Typography variant="small">Optional note</Typography>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={1000}
                />
              </label>
              <div className="form-actions">
                {job.status === "ASSIGNED" ? (
                  <button
                    className="button button-primary"
                    disabled={submitting}
                    onClick={() => void advance("EN_ROUTE")}
                    type="button"
                  >
                    <Typography variant="button">Mark en route</Typography>
                  </button>
                ) : null}
                {job.status === "EN_ROUTE" ? (
                  <button
                    className="button button-primary"
                    disabled={submitting}
                    onClick={() => void advance("ON_SITE")}
                    type="button"
                  >
                    <Typography variant="button">Mark on site</Typography>
                  </button>
                ) : null}
                {job.status === "ON_SITE" ? (
                  <button
                    className="button button-primary"
                    disabled={submitting}
                    onClick={() => void advance("COMPLETED")}
                    type="button"
                  >
                    <Typography variant="button">Mark completed</Typography>
                  </button>
                ) : null}
                <button
                  className="button"
                  disabled={submitting}
                  onClick={() => void advance("CANCELED")}
                  type="button"
                >
                  <Typography variant="button">Cancel job</Typography>
                </button>
              </div>
            </>
          ) : null}

          {error ? (
            <Typography variant="bodyMedium" className="error">
              {error}
            </Typography>
          ) : null}
        </section>

        <section className="panel">
          <Typography variant="h3">Status timeline</Typography>
          <ul className="timeline">
            {job.events.map((event) => (
              <Typography variant="li" key={event.id} className="timeline-item">
                {STATUS_LABEL[event.toStatus]} · {event.actorType.toLowerCase()} {event.actorId} ·{" "}
                {formatTimestamp(event.occurredAt)}
                {event.note ? ` — ${event.note}` : ""}
              </Typography>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
