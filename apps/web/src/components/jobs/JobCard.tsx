import Link from "next/link";
import { Job } from "@field-ops/contracts";
import { Typography } from "../Typography";
import { JobStatusBadge } from "./JobStatusBadge";
import { cn } from "../../lib/cn";
import { formatRelativeTime, shortJobId, STATUS_DOT_CLASS } from "../../lib/status";

export function JobCard({
  job,
  workerName,
  showStatus = false,
}: {
  job: Job;
  workerName: string;
  showStatus?: boolean;
}) {
  return (
    <article className="flex min-h-[7.5rem] w-full shrink-0 overflow-hidden rounded-lg border border-border bg-white shadow-card transition duration-150 ease-out hover:border-primary">
      <span
        aria-hidden="true"
        className={cn("w-1 shrink-0", STATUS_DOT_CLASS[job.status])}
      />
      <div className="min-w-0 flex-1 p-3">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="min-w-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Typography
              variant="small"
              className="block min-w-0 font-medium tracking-wide text-ink-muted"
            >
              {shortJobId(job.id)}
            </Typography>
          </Link>
          {showStatus ? (
            <span className="shrink-0">
              <JobStatusBadge status={job.status} />
            </span>
          ) : null}
        </div>
        <Link
          href={`/jobs/${job.id}`}
          className="mt-1 block min-w-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Typography
            variant="h3"
            className="block min-w-0 overflow-hidden break-words [overflow-wrap:anywhere] line-clamp-2 hover:text-primary"
          >
            {job.title}
          </Typography>
        </Link>
        <Typography
          variant="small"
          className="mt-1.5 block min-w-0 overflow-hidden break-words [overflow-wrap:anywhere] line-clamp-2 text-ink-secondary"
        >
          {job.address ?? "No address"}
        </Typography>
        <Typography variant="small" className="mt-2 block min-w-0 truncate text-ink">
          {workerName}
        </Typography>
        <Typography variant="small" className="mt-0.5 block min-w-0 truncate">
          {formatRelativeTime(job.updatedAt)}
        </Typography>
      </div>
    </article>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="flex min-h-[7.5rem] w-full shrink-0 overflow-hidden rounded-lg border border-border bg-white">
      <span aria-hidden="true" className="w-1 shrink-0 bg-surface-muted" />
      <div className="min-w-0 flex-1 p-3">
        <div className="h-3 w-16 animate-pulse rounded bg-surface-muted motion-reduce:animate-none" />
        <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-surface-muted motion-reduce:animate-none" />
        <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-surface-muted motion-reduce:animate-none" />
        <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-surface-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}
