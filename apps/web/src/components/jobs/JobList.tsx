"use client";

import { Job, JobStatus } from "@field-ops/contracts";
import { Typography } from "../Typography";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";
import { DraggableJobCard } from "./JobBoardDnd";
import { JobCardSkeleton } from "./JobCard";
import { STATUS_LABEL } from "../../lib/status";

export type JobListProps = {
  status: JobStatus;
  jobs: Job[];
  workerNameById: Record<string, string>;
  loading: boolean;
  filtered: boolean;
  nextCursor: string | null;
  loadingMore: boolean;
  onLoadMore: () => void;
  loadMoreError: string | null;
  showStatus?: boolean;
};

export function JobList({
  status,
  jobs,
  workerNameById,
  loading,
  filtered,
  nextCursor,
  loadingMore,
  onLoadMore,
  loadMoreError,
  showStatus = false,
}: JobListProps) {
  const errorId = `load-more-error-${status}`;
  return (
    <>
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
        <DraggableJobCard
          key={job.id}
          job={job}
          workerName={workerNameById[job.workerId] ?? "Unknown worker"}
          showStatus={showStatus}
        />
      ))}
      {nextCursor || loadMoreError ? (
        <div className="flex shrink-0 flex-col gap-2">
          {loadMoreError ? (
            <div id={errorId} role="status">
              <Typography variant="small" className="text-danger">
                {loadMoreError}
              </Typography>
            </div>
          ) : null}
          {nextCursor ? (
            <Button
              variant="ghost"
              className={cn("w-full", loadingMore && "opacity-60")}
              aria-label={`Load more ${STATUS_LABEL[status].toLowerCase()} jobs`}
              aria-busy={loadingMore}
              aria-disabled={loadingMore}
              aria-describedby={loadMoreError ? errorId : undefined}
              onClick={() => {
                if (loadingMore) return;
                onLoadMore();
              }}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
