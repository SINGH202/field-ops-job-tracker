import Link from "next/link";
import { Job } from "@field-ops/contracts";
import { Typography } from "../Typography";
import { JobStatusBadge } from "./JobStatusBadge";
import { formatRelativeTime, shortJobId } from "../../lib/status";

export function JobCard({
  job,
  workerName,
}: {
  job: Job;
  workerName: string;
}) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-lg border border-border bg-white p-3 shadow-card transition duration-150 ease-out hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Typography variant="small" className="font-medium tracking-wide text-ink-muted">
        {shortJobId(job.id)}
      </Typography>
      <Typography variant="h3" className="mt-1 line-clamp-2">
        {job.title}
      </Typography>
      <div className="mt-2">
        <JobStatusBadge status={job.status} />
      </div>
      <div className="mt-2 space-y-0.5">
        <Typography variant="small" className="truncate text-ink-secondary">
          {job.address ?? "No address"}
        </Typography>
        <Typography variant="small" className="truncate">
          {workerName}
        </Typography>
        <Typography variant="small">{formatRelativeTime(job.updatedAt)}</Typography>
      </div>
    </Link>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <div className="h-3 w-16 animate-pulse rounded bg-surface-muted motion-reduce:animate-none" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-surface-muted motion-reduce:animate-none" />
      <div className="mt-3 h-5 w-20 animate-pulse rounded-full bg-surface-muted motion-reduce:animate-none" />
      <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-surface-muted motion-reduce:animate-none" />
      <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-surface-muted motion-reduce:animate-none" />
    </div>
  );
}
