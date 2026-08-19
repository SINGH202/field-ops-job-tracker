import { JobStatus } from "@field-ops/contracts";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, "NOT_FOUND", `${resource} ${id} was not found`);
  }
}

export class IllegalTransitionError extends AppError {
  constructor(from: JobStatus, to: JobStatus) {
    super(
      409,
      "ILLEGAL_TRANSITION",
      `Cannot move a job from ${from} to ${to}`,
      { from, to },
    );
  }
}

export class IdempotencyConflictError extends AppError {
  constructor() {
    super(
      409,
      "IDEMPOTENCY_KEY_REUSED",
      "Idempotency-Key was reused with a different request body",
    );
  }
}

export class MissingIdempotencyKeyError extends AppError {
  constructor() {
    super(400, "MISSING_IDEMPOTENCY_KEY", "Idempotency-Key header is required");
  }
}
