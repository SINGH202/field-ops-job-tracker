"use client";

import { Typography } from "../Typography";
import { DroppableStatus } from "./JobBoardDnd";
import { JobList, JobListProps } from "./JobList";
import { JobStatusBadge } from "./JobStatusBadge";

type JobColumnProps = JobListProps;

export function JobColumn({
  status,
  jobs,
  workerNameById,
  loading,
  filtered,
  nextCursor,
  loadingMore,
  onLoadMore,
  loadMoreError,
}: JobColumnProps) {
  return (
    <DroppableStatus status={status} className="flex h-full min-h-0 min-w-0 flex-col">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <JobStatusBadge status={status} />
          <Typography variant="small" className="shrink-0 font-semibold text-ink">
            {nextCursor ? `${jobs.length}+` : jobs.length}
          </Typography>
        </header>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto p-2">
          <JobList
            status={status}
            jobs={jobs}
            workerNameById={workerNameById}
            loading={loading}
            filtered={filtered}
            nextCursor={nextCursor}
            loadingMore={loadingMore}
            onLoadMore={onLoadMore}
            loadMoreError={loadMoreError}
          />
        </div>
      </section>
    </DroppableStatus>
  );
}
