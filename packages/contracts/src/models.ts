import { z } from "zod";

export const JOB_STATUSES = [
  "ASSIGNED",
  "EN_ROUTE",
  "ON_SITE",
  "COMPLETED",
  "CANCELED",
] as const;

export const JobStatusSchema = z.enum(JOB_STATUSES);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const ActorTypeSchema = z.enum(["DISPATCHER", "WORKER"]);
export type ActorType = z.infer<typeof ActorTypeSchema>;

export const JobSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  workerId: z.string().uuid(),
  status: JobStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Job = z.infer<typeof JobSchema>;

export const JobEventSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  fromStatus: JobStatusSchema.nullable(),
  toStatus: JobStatusSchema,
  actorType: ActorTypeSchema,
  actorId: z.string(),
  note: z.string().nullable(),
  occurredAt: z.string().datetime(),
});
export type JobEvent = z.infer<typeof JobEventSchema>;

export const JobWithEventsSchema = JobSchema.extend({
  events: z.array(JobEventSchema),
});
export type JobWithEvents = z.infer<typeof JobWithEventsSchema>;

export const WorkerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
});
export type Worker = z.infer<typeof WorkerSchema>;
