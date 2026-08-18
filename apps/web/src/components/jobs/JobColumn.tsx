import { Job, JobStatus } from "@field-ops/contracts";
import { Typography } from "../Typography";
import { EmptyState } from "../ui/EmptyState";
import { JobCard, JobCardSkeleton } from "./JobCard";
import { JobStatusBadge } from "./JobStatusBadge";
import { STATUS_LABEL } from "../../lib/status";

export function JobColumn({
  status,
  jobs,
  workerNameById,
  loading,
  filtered,
}: {
  status: JobStatus;
  jobs: Job[];
  workerNameById: Record<string, string>;
  loading: boolean;
  filtered: boolean;
}) {
  return (
    <section className="flex min-h-64 min-w-0 flex-col rounded-lg border border-border bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <JobStatusBadge status={status} />
        <Typography variant="small" className="font-semibold text-ink">
          {jobs.length}
        </Typography>
      </header>
      <div className="flex flex-1 flex-col gap-2 p-2">
        {loading && jobs.length === 0
          ? [0, 1].map((key) => <JobCardSkeleton key={key} />)
          : null}
        {!loading && jobs.length === 0 ? (
          <EmptyState
            title={`No ${STATUS_LABEL[status].toLowerCase()} jobs`}
            description={
              filtered
                ? "No jobs match the selected worker."
                : "There are currently no jobs in this status."
            }
          />
        ) : null}
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            workerName={workerNameById[job.workerId] ?? "Unknown worker"}
          />
        ))}
      </div>
    </section>
  );
}
