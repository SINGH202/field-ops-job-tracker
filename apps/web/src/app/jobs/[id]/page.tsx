"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { forwardTarget, JobStatus, JobWithEvents } from "@field-ops/contracts";
import { JobStatusBadge } from "../../../components/jobs/JobStatusBadge";
import { JobTimeline } from "../../../components/jobs/JobTimeline";
import { PageShell } from "../../../components/layout/PageShell";
import { Typography } from "../../../components/Typography";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ErrorState } from "../../../components/ui/EmptyState";
import { Input } from "../../../components/ui/Input";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ApiError, getJob, listWorkers, transitionJob } from "../../../lib/api";
import { formatTimestamp, nextStatusLabel } from "../../../lib/status";

const DISPATCHER_ID = "dispatcher-1";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<JobWithEvents | null>(null);
  const [workerName, setWorkerName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getJob(params.id, controller.signal)
      .then(setJob)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("We couldn't load this job right now.");
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
      setError(err instanceof ApiError ? err.message : "That status change could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!job && !error) {
    return (
      <PageShell>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-8 w-64" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </PageShell>
    );
  }

  if (!job) {
    return (
      <PageShell>
        <ErrorState title="Something went wrong" description={error ?? "Job not found."} />
      </PageShell>
    );
  }

  const upcoming = forwardTarget(job.status);
  const upcomingLabel = nextStatusLabel(job.status);
  const canAct = job.status !== "COMPLETED" && job.status !== "CANCELED";

  return (
    <PageShell>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-ink-secondary transition duration-150 ease-out hover:text-ink"
      >
        <Typography variant="link">Back to board</Typography>
      </Link>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Typography variant="h2" className="break-words">
            {job.title}
          </Typography>
          <Typography variant="small" className="mt-1">
            Updated {formatTimestamp(job.updatedAt)}
          </Typography>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <Typography variant="h3">Job information</Typography>
          <Meta label="Address" value={job.address ?? "—"} />
          <Meta label="Worker" value={workerName || "—"} />
          <Meta label="Description" value={job.description ?? "No description"} />

          {canAct ? (
            <div className="space-y-3 border-t border-border pt-4">
              <Input
                id="note"
                name="note"
                label="Optional note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={1000}
                placeholder="Visible on the status timeline"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                {upcoming && upcomingLabel ? (
                  <Button
                    disabled={submitting}
                    onClick={() => void advance(upcoming)}
                    className="sm:flex-1"
                  >
                    {submitting ? "Updating…" : upcomingLabel}
                  </Button>
                ) : null}
                <Button
                  variant="danger"
                  disabled={submitting}
                  onClick={() => void advance("CANCELED")}
                  className="sm:flex-1"
                >
                  Cancel job
                </Button>
              </div>
            </div>
          ) : null}

          {error ? (
            <ErrorState title="Transition failed" description={error} />
          ) : null}
        </Card>

        <Card>
          <Typography variant="h3">Status history</Typography>
          <div className="mt-4">
            {job.events.length === 0 ? (
              <Typography variant="small">No status events yet.</Typography>
            ) : (
              <JobTimeline events={job.events} />
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Typography variant="small" className="font-medium text-ink-muted">
        {label}
      </Typography>
      <Typography variant="bodyMedium" className="mt-0.5 break-words">
        {value}
      </Typography>
    </div>
  );
}
