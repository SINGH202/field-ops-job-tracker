import { IdempotencyKeySchema } from "@field-ops/contracts";
import { NextFunction, Request, Response } from "express";
import { MissingIdempotencyKeyError, ValidationError } from "../errors";

export function requireIdempotencyKey(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.header("Idempotency-Key");
  if (!header) {
    next(new MissingIdempotencyKeyError());
    return;
  }
  const parsed = IdempotencyKeySchema.safeParse(header);
  if (!parsed.success) {
    next(new ValidationError("Idempotency-Key header is invalid"));
    return;
  }
  req.idempotencyKey = parsed.data;
  next();
}

declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}
