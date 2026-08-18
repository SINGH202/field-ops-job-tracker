"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Job, JobStatus, Worker } from "@field-ops/contracts";
import { JobCard, JobCardSkeleton } from "../components/jobs/JobCard";
import { JobColumn } from "../components/jobs/JobColumn";
import { JobStatusBadge } from "../components/jobs/JobStatusBadge";
import { PageShell } from "../components/layout/PageShell";
import { Typography } from "../components/Typography";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { Select } from "../components/ui/Select";
import { listJobs, listWorkers } from "../lib/api";
import { cn } from "../lib/cn";
import { BOARD_STATUSES, STATUS_LABEL } from "../lib/status";

const POLL_MS = 4000;

type StatusFilter = "ALL" | JobStatus;

function emptyBoard(): Record<JobStatus, Job[]> {
  return {
    ASSIGNED: [],
    EN_ROUTE: [],
    ON_SITE: [],
    COMPLETED: [],
    CANCELED: [],
  };
}

export default function BoardPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [jobsByStatus, setJobsByStatus] = useState<Record<JobStatus, Job[]>>(emptyBoard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const workerNameById = useMemo(
    () => Object.fromEntries(workers.map((worker) => [worker.id, worker.name])),
    [workers],
  );

  useEffect(() => {
    const controller = new AbortController();
    listWorkers(controller.signal)
      .then(setWorkers)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("We couldn't load workers right now.");
      });
    return () => controller.abort();
  }, []);

  const refresh = useCallback(
    async (signal?: AbortSignal, silent = false) => {
      if (!silent) setLoading(true);
      try {
        const entries = await Promise.all(
          BOARD_STATUSES.map(async (status) => {
            const jobs = await listJobs(
              { status, workerId: workerId || undefined, limit: 50 },
              signal,
            );
            return [status, jobs] as const;
          }),
        );
        setJobsByStatus(Object.fromEntries(entries) as Record<JobStatus, Job[]>);
        setError(null);
        setUpdatedAt(new Date());
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("We couldn't load the jobs right now.");
      } finally {
        setLoading(false);
      }
    },
    [workerId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const timer = window.setInterval(() => {
      void refresh(controller.signal, true);
    }, POLL_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [refresh]);

  const visibleStatuses =
    statusFilter === "ALL" ? BOARD_STATUSES : BOARD_STATUSES.filter((status) => status === statusFilter);
  const filtered = Boolean(workerId);

  return (
    <PageShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Typography variant="h2">Jobs</Typography>
          <Typography variant="small" className="mt-1">
            Live board of every job by status. Filter by worker to inspect a single route.
          </Typography>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="sm:w-56">
            <Select
              label="Worker"
              value={workerId}
              onChange={(event) => setWorkerId(event.target.value)}
            >
              <option value="">All workers</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </Select>
          </div>
          <div
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-3"
            aria-live="polite"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-completed opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-completed" />
            </span>
            <Typography variant="small" className="font-medium text-ink-secondary">
              Live
              {updatedAt
                ? ` · ${updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                : ""}
            </Typography>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4">
          <ErrorState
            title="Something went wrong"
            description={error}
            onRetry={() => void refresh()}
          />
        </div>
      ) : null}

      <div className="mt-4 lg:hidden">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          <StatusChip
            label="All"
            active={statusFilter === "ALL"}
            count={BOARD_STATUSES.reduce((sum, status) => sum + jobsByStatus[status].length, 0)}
            onClick={() => setStatusFilter("ALL")}
          />
          {BOARD_STATUSES.map((status) => (
            <StatusChip
              key={status}
              label={STATUS_LABEL[status]}
              active={statusFilter === status}
              count={jobsByStatus[status].length}
              onClick={() => setStatusFilter(status)}
            />
          ))}
        </div>
        <div className="mt-3 space-y-5">
          {visibleStatuses.map((status) => (
            <section key={status}>
              <div className="mb-2 flex items-center justify-between">
                <JobStatusBadge status={status} />
                <Typography variant="small" className="font-semibold text-ink">
                  {jobsByStatus[status].length}
                </Typography>
              </div>
              <div className="space-y-2">
                {loading && jobsByStatus[status].length === 0
                  ? [0, 1].map((key) => <JobCardSkeleton key={key} />)
                  : null}
                {!loading && jobsByStatus[status].length === 0 ? (
                  <EmptyState
                    title={`No ${STATUS_LABEL[status].toLowerCase()} jobs`}
                    description={
                      filtered
                        ? "No jobs match the selected worker."
                        : "There are currently no jobs in this status."
                    }
                  />
                ) : null}
                {jobsByStatus[status].map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    workerName={workerNameById[job.workerId] ?? "Unknown worker"}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="mt-4 hidden grid-cols-5 gap-3 lg:grid">
        {BOARD_STATUSES.map((status) => (
          <JobColumn
            key={status}
            status={status}
            jobs={jobsByStatus[status]}
            workerNameById={workerNameById}
            loading={loading}
            filtered={filtered}
          />
        ))}
      </div>
    </PageShell>
  );
}

function StatusChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 transition duration-150 ease-out",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-border bg-surface text-ink-secondary",
      )}
    >
      <Typography variant="button">{label}</Typography>
      <Typography variant="small" className={active ? "text-on-primary" : undefined}>
        {count}
      </Typography>
    </button>
  );
}
