"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JobStatus, Worker } from "@field-ops/contracts";
import { JobColumn } from "../components/jobs/JobColumn";
import { JobList } from "../components/jobs/JobList";
import { JobStatusBadge } from "../components/jobs/JobStatusBadge";
import { PageShell } from "../components/layout/PageShell";
import { Typography } from "../components/Typography";
import { ErrorState } from "../components/ui/EmptyState";
import { Select } from "../components/ui/Select";
import { useJobBoard } from "../hooks/useJobBoard";
import { listWorkers } from "../lib/api";
import { cn } from "../lib/cn";
import { BOARD_STATUSES, STATUS_LABEL } from "../lib/status";

type StatusFilter = "ALL" | JobStatus;

function loadedCountLabel(count: number, hasMore: boolean): string {
  return hasMore ? `${count}+` : String(count);
}

export default function BoardPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const { columns, loading, error, updatedAt, refresh, loadMore } = useJobBoard(workerId);

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

  const visibleStatuses =
    statusFilter === "ALL" ? BOARD_STATUSES : BOARD_STATUSES.filter((status) => status === statusFilter);
  const filtered = Boolean(workerId);
  const boardError = workerError ?? error;
  const totalLoaded = BOARD_STATUSES.reduce((sum, status) => sum + columns[status].jobs.length, 0);
  const hasMoreAnywhere = BOARD_STATUSES.some((status) => columns[status].nextCursor);

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
              <section key={status}>
                <div className="mb-2 flex items-center justify-between">
                  <JobStatusBadge status={status} />
                  <Typography variant="small" className="font-semibold text-ink">
                    {loadedCountLabel(column.jobs.length, Boolean(column.nextCursor))}
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
                  />
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="mt-4 hidden grid-cols-5 gap-3 lg:grid">
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
    </PageShell>
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
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 transition duration-150 ease-out",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-border bg-surface text-ink-secondary",
      )}
    >
      <Typography variant="button">{label}</Typography>
      <Typography variant="small" className={active ? "text-on-primary" : undefined}>
        {countLabel}
      </Typography>
    </button>
  );
}
