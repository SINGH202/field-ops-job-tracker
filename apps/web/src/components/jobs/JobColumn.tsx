import { Typography } from "../Typography";
import { JobList, JobListProps } from "./JobList";
import { JobStatusBadge } from "./JobStatusBadge";

export type JobColumnProps = JobListProps;

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
    <section className="flex min-h-64 min-w-0 flex-col rounded-lg border border-border bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <JobStatusBadge status={status} />
        <Typography variant="small" className="font-semibold text-ink">
          {nextCursor ? `${jobs.length}+` : jobs.length}
        </Typography>
      </header>
      <div className="flex flex-1 flex-col gap-2 p-2">
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
  );
}
