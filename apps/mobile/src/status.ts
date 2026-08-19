import { JobStatus, forwardTarget } from "@field-ops/contracts";
import { colors } from "./theme";

export const STATUS_LABEL: Record<JobStatus, string> = {
  ASSIGNED: "Assigned",
  EN_ROUTE: "En route",
  ON_SITE: "On site",
  COMPLETED: "Completed",
  CANCELED: "Canceled",
};

export const STATUS_COLORS: Record<JobStatus, { text: string; background: string }> = {
  ASSIGNED: { text: colors.assigned, background: colors.assignedSoft },
  EN_ROUTE: { text: colors.enroute, background: colors.enrouteSoft },
  ON_SITE: { text: colors.onsite, background: colors.onsiteSoft },
  COMPLETED: { text: colors.completed, background: colors.completedSoft },
  CANCELED: { text: colors.canceled, background: colors.canceledSoft },
};

export function illegalTransitionMessage(from: JobStatus, to: JobStatus): string {
  return `Can't move a ${STATUS_LABEL[from].toLowerCase()} job to ${STATUS_LABEL[to].toLowerCase()}. Use the next status, or Canceled.`;
}

export function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function nextStatusLabel(status: JobStatus): string | null {
  const target = forwardTarget(status);
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
