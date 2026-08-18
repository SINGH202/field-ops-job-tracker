import { JOB_STATUSES, JobStatus } from "@field-ops/contracts";

export const STATUS_LABEL: Record<JobStatus, string> = {
  ASSIGNED: "Assigned",
  EN_ROUTE: "En route",
  ON_SITE: "On site",
  COMPLETED: "Completed",
  CANCELED: "Canceled",
};

export const BOARD_STATUSES = JOB_STATUSES;

export function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
