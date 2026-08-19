"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Job, JobStatus, Worker } from "@field-ops/contracts";
import { DroppableStatus, JobBoardDnd } from "../components/jobs/JobBoardDnd";
import { JobColumn } from "../components/jobs/JobColumn";
import { JobList } from "../components/jobs/JobList";
import { JobStatusBadge } from "../components/jobs/JobStatusBadge";
import { PageShell } from "../components/layout/PageShell";
import { Typography } from "../components/Typography";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ErrorState } from "../components/ui/EmptyState";
import { Select } from "../components/ui/Select";
import { useJobBoard } from "../hooks/useJobBoard";
import { ApiError, listWorkers, transitionJob } from "../lib/api";
import { cn } from "../lib/cn";
import {
  BOARD_STATUSES,
  STATUS_LABEL,
  illegalTransitionMessage,
} from "../lib/status";

type StatusFilter = "ALL" | JobStatus;

const ALL_WORKERS = "all";
const DISPATCHER_ID = "dispatcher-1";

function loadedCountLabel(count: number, hasMore: boolean): string {
  return hasMore ? `${count}+` : String(count);
}

export default function BoardPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const { columns, loading, error, live, updatedAt, refresh, loadMore } =
    useJobBoard(workerId);
  const [dropHint, setDropHint] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<Job | null>(null);
  const [canceling, setCanceling] = useState(false);

  const workerNameById = useMemo(
    () => Object.fromEntries(workers.map((worker) => [worker.id, worker.name])),
    [workers],
  );

  const loadWorkers = useCallback(async (signal?: AbortSignal) => {
    try {
      const nextWorkers = await listWorkers(signal);
      setWorkers(nextWorkers);
      setWorkerError(null);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setWorkerError("We couldn't load workers right now.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadWorkers(controller.signal);
    return () => controller.abort();
  }, [loadWorkers]);

  const moveJob = useCallback(
    async (job: Job, toStatus: JobStatus) => {
      if (toStatus === "CANCELED") {
        setPendingCancel(job);
        return;
      }
      setDropHint(null);
      try {
        await transitionJob(job.id, {
          toStatus,
          actorType: "DISPATCHER",
          actorId: DISPATCHER_ID,
        });
        await refresh(true);
      } catch (err: unknown) {
        setDropHint(
          err instanceof ApiError && err.code === "ILLEGAL_TRANSITION"
            ? illegalTransitionMessage(job.status, toStatus)
            : err instanceof ApiError
              ? err.message
              : "That status change could not be saved.",
        );
        await refresh(true);
      }
    },
    [refresh],
  );

  const confirmCancel = useCallback(async () => {
    if (!pendingCancel) return;
    setCanceling(true);
    setDropHint(null);
    try {
      await transitionJob(pendingCancel.id, {
        toStatus: "CANCELED",
        actorType: "DISPATCHER",
        actorId: DISPATCHER_ID,
      });
      setPendingCancel(null);
      await refresh(true);
    } catch (err: unknown) {
      setDropHint(
        err instanceof ApiError
          ? err.message
          : "That status change could not be saved.",
      );
      await refresh(true);
    } finally {
      setCanceling(false);
    }
  }, [pendingCancel, refresh]);

  const rejectDrop = useCallback(
    (fromStatus: JobStatus, toStatus: JobStatus) => {
      setDropHint(illegalTransitionMessage(fromStatus, toStatus));
    },
    [],
  );

  const visibleStatuses =
    statusFilter === "ALL"
      ? BOARD_STATUSES
      : BOARD_STATUSES.filter((status) => status === statusFilter);
  const filtered = Boolean(workerId);
  const boardError = workerError ?? error;
  const totalLoaded = BOARD_STATUSES.reduce(
    (sum, status) => sum + columns[status].jobs.length,
    0,
  );
  const hasMoreAnywhere = BOARD_STATUSES.some(
    (status) => columns[status].nextCursor,
  );

  return (
    <PageShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Typography variant="h2">Jobs</Typography>
          <Typography variant="small" className="mt-1">
            Live board of every job by status. Drag a job to the next step, or
            to Canceled.
          </Typography>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="sm:w-56">
            <Select
              label="Worker"
              value={workerId || ALL_WORKERS}
              onValueChange={(value) =>
                setWorkerId(value === ALL_WORKERS ? "" : value)
              }
              options={[
                { value: ALL_WORKERS, label: "All workers" },
                ...workers.map((worker) => ({
                  value: worker.id,
                  label: worker.name,
                })),
              ]}
            />
          </div>
          <LiveStatus
            live={live}
            updatedAt={updatedAt}
            onRetry={() => void refresh()}
          />
        </div>
      </div>

      {boardError ? (
        <div className="mt-4">
          <ErrorState
            title="Something went wrong"
            description={boardError}
            onRetry={() => {
              if (workerError) void loadWorkers();
              void refresh();
            }}
          />
        </div>
      ) : null}

      {dropHint ? (
        <div className="mt-4" role="status">
          <Typography variant="small" className="text-danger">
            {dropHint}
          </Typography>
        </div>
      ) : null}

      <JobBoardDnd
        workerNameById={workerNameById}
        onMove={moveJob}
        onRejectedDrop={rejectDrop}>
        <div className="mt-4 lg:hidden">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
            <StatusChip
              label="All"
              active={statusFilter === "ALL"}
              countLabel={loadedCountLabel(totalLoaded, hasMoreAnywhere)}
              onClick={() => setStatusFilter("ALL")}
            />
            {BOARD_STATUSES.map((status) => (
              <StatusChip
                key={status}
                label={STATUS_LABEL[status]}
                active={statusFilter === status}
                countLabel={loadedCountLabel(
                  columns[status].jobs.length,
                  Boolean(columns[status].nextCursor),
                )}
                onClick={() => setStatusFilter(status)}
              />
            ))}
          </div>
          <div className="mt-3 space-y-5">
            {visibleStatuses.map((status) => {
              const column = columns[status];
              return (
                <DroppableStatus
                  key={status}
                  status={status}
                  className="rounded-lg">
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <JobStatusBadge status={status} />
                      <Typography
                        variant="small"
                        className="font-semibold text-ink">
                        {loadedCountLabel(
                          column.jobs.length,
                          Boolean(column.nextCursor),
                        )}
                      </Typography>
                    </div>
                    <div className="flex flex-col gap-2">
                      <JobList
                        status={status}
                        jobs={column.jobs}
                        workerNameById={workerNameById}
                        loading={loading}
                        filtered={filtered}
                        nextCursor={column.nextCursor}
                        loadingMore={column.loadingMore}
                        onLoadMore={() => void loadMore(status)}
                        loadMoreError={column.loadMoreError}
                        showStatus
                      />
                    </div>
                  </section>
                </DroppableStatus>
              );
            })}
          </div>
        </div>

        <div className="mt-4 hidden h-[calc(100dvh-11.5rem)] min-h-0 grid-cols-5 gap-3 lg:grid">
          {BOARD_STATUSES.map((status) => {
            const column = columns[status];
            return (
              <JobColumn
                key={status}
                status={status}
                jobs={column.jobs}
                workerNameById={workerNameById}
                loading={loading}
                filtered={filtered}
                nextCursor={column.nextCursor}
                loadingMore={column.loadingMore}
                onLoadMore={() => void loadMore(status)}
                loadMoreError={column.loadMoreError}
              />
            );
          })}
        </div>
      </JobBoardDnd>
      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Cancel this job?"
        description={
          pendingCancel
            ? `${pendingCancel.title} will move to Canceled. This cannot be undone.`
            : "This cannot be undone."
        }
        busy={canceling}
        onConfirm={() => void confirmCancel()}
        onCancel={() => {
          if (!canceling) setPendingCancel(null);
        }}
      />
    </PageShell>
  );
}

function liveLabel(live: boolean, updatedAt: Date | null): string {
  const time = updatedAt
    ? updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;
  if (live) return time ? `Live · ${time}` : "Live";
  if (time) return `Offline · last ${time}`;
  return "Connecting";
}

function LiveStatus({
  live,
  updatedAt,
  onRetry,
}: {
  live: boolean;
  updatedAt: Date | null;
  onRetry: () => void;
}) {
  const canRetry = !live && updatedAt !== null;
  const label = liveLabel(live, updatedAt);
  const dotClass = live
    ? "bg-completed"
    : updatedAt
      ? "bg-danger"
      : "bg-ink-muted";
  const className = cn(
    "inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-3",
    canRetry && "hover:bg-surface-muted",
  );

  const contents = (
    <>
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {live ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-completed opacity-60 motion-reduce:hidden" />
        ) : null}
        <span
          className={cn("relative inline-flex h-2 w-2 rounded-full", dotClass)}
        />
      </span>
      <Typography variant="small" className="font-medium text-ink-secondary">
        {label}
      </Typography>
    </>
  );

  if (canRetry) {
    return (
      <button
        type="button"
        className={className}
        aria-live="polite"
        aria-label="Board is offline. Retry now."
        onClick={onRetry}>
        {contents}
      </button>
    );
  }

  return (
    <div className={className} aria-live="polite">
      {contents}
    </div>
  );
}

function StatusChip({
  label,
  countLabel,
  active,
  onClick,
}: {
  label: string;
  countLabel: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label}, ${countLabel} jobs`}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 transition duration-150 ease-out",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-border bg-surface text-ink-secondary",
      )}>
      <Typography variant="button">{label}</Typography>
      <Typography
        variant="small"
        className={active ? "text-on-primary" : undefined}>
        {countLabel}
      </Typography>
    </button>
  );
}
