import { JOB_STATUSES, JobStatus } from "@field-ops/contracts";

export const STATUS_LABEL: Record<JobStatus, string> = {
  ASSIGNED: "Assigned",
  EN_ROUTE: "En route",
  ON_SITE: "On site",
  COMPLETED: "Completed",
  CANCELED: "Canceled",
};

export const BOARD_STATUSES = JOB_STATUSES;

export const STATUS_BADGE_CLASS: Record<JobStatus, string> = {
  ASSIGNED: "bg-assigned-soft text-assigned",
  EN_ROUTE: "bg-enroute-soft text-enroute",
  ON_SITE: "bg-onsite-soft text-onsite",
  COMPLETED: "bg-completed-soft text-completed",
  CANCELED: "bg-canceled-soft text-canceled",
};

export const STATUS_DOT_CLASS: Record<JobStatus, string> = {
  ASSIGNED: "bg-assigned",
  EN_ROUTE: "bg-enroute",
  ON_SITE: "bg-onsite",
  COMPLETED: "bg-completed",
  CANCELED: "bg-canceled",
};

export function shortJobId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Updated just now";
  if (minutes === 1) return "Updated 1 min ago";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours === 1) return "Updated 1 hr ago";
  if (hours < 24) return `Updated ${hours} hr ago`;
  return `Updated ${formatTimestamp(value)}`;
}

export function nextStatus(status: JobStatus): JobStatus | null {
  switch (status) {
    case "ASSIGNED":
      return "EN_ROUTE";
    case "EN_ROUTE":
      return "ON_SITE";
    case "ON_SITE":
      return "COMPLETED";
    case "COMPLETED":
      return null;
    case "CANCELED":
      return null;
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function nextStatusLabel(status: JobStatus): string | null {
  const target = nextStatus(status);
  if (!target) return null;
  switch (target) {
    case "EN_ROUTE":
      return "Mark en route";
    case "ON_SITE":
      return "Mark on site";
    case "COMPLETED":
      return "Mark completed";
    case "ASSIGNED":
    case "CANCELED":
      return null;
    default: {
      const exhaustive: never = target;
      return exhaustive;
    }
  }
}
