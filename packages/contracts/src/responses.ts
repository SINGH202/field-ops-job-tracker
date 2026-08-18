import { z } from "zod";
import { JobSchema, WorkerSchema } from "./models";

export const ErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ErrorBody = z.infer<typeof ErrorBodySchema>;

export const ListJobsResponseSchema = z.object({
  data: z.array(JobSchema),
  nextCursor: z.string().nullable(),
});
export type ListJobsResponse = z.infer<typeof ListJobsResponseSchema>;

export const HealthResponseSchema = z.object({
  ok: z.literal(true),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ListWorkersResponseSchema = z.object({
  data: z.array(WorkerSchema),
});
export type ListWorkersResponse = z.infer<typeof ListWorkersResponseSchema>;
