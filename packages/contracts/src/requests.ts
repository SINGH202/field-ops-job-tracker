import { z } from "zod";
import { ActorTypeSchema, JobStatusSchema } from "./models";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

export const CreateJobRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().max(500).optional(),
  workerId: z.string().uuid(),
  actorId: z.string().trim().min(1).max(100),
});
export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;

export const TransitionJobRequestSchema = z.object({
  toStatus: JobStatusSchema,
  actorType: ActorTypeSchema,
  actorId: z.string().trim().min(1).max(100),
  note: z.string().trim().max(1000).optional(),
});
export type TransitionJobRequest = z.infer<typeof TransitionJobRequestSchema>;

export const ListJobsQuerySchema = z.object({
  workerId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  status: z.preprocess(emptyToUndefined, JobStatusSchema.optional()),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).default(20)),
  cursor: z.preprocess(emptyToUndefined, z.string().min(1).max(500).optional()),
});
export type ListJobsQuery = z.infer<typeof ListJobsQuerySchema>;

export const IdempotencyKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(255);

export const JobIdParamSchema = z.object({
  id: z.string().uuid(),
});
