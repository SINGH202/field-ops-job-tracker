import { JobStatus } from "@field-ops/contracts";
import { IllegalTransitionError } from "../errors";

export function allowedTargets(status: JobStatus): readonly JobStatus[] {
  switch (status) {
    case "ASSIGNED":
      return ["EN_ROUTE", "CANCELED"];
    case "EN_ROUTE":
      return ["ON_SITE", "CANCELED"];
    case "ON_SITE":
      return ["COMPLETED", "CANCELED"];
    case "COMPLETED":
      return [];
    case "CANCELED":
      return [];
    default: {
      const exhaustive: never = status;
      throw new Error(`Unhandled job status: ${exhaustive}`);
    }
  }
}

export function isTerminal(status: JobStatus): boolean {
  return allowedTargets(status).length === 0;
}

export function isNoOpTransition(current: JobStatus, requested: JobStatus): boolean {
  return current === requested;
}

export function assertLegalTransition(current: JobStatus, requested: JobStatus): void {
  if (isNoOpTransition(current, requested)) {
    return;
  }
  if (!allowedTargets(current).includes(requested)) {
    throw new IllegalTransitionError(current, requested);
  }
}
