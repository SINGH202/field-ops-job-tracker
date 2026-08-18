import { isLegalTransition, JobStatus } from "@field-ops/contracts";
import { IllegalTransitionError } from "../errors";

export function assertLegalTransition(current: JobStatus, requested: JobStatus): void {
  if (!isLegalTransition(current, requested)) {
    throw new IllegalTransitionError(current, requested);
  }
}
