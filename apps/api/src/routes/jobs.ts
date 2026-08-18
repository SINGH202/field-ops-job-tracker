import {
  CreateJobRequest,
  CreateJobRequestSchema,
  JobIdParamSchema,
  ListJobsQuery,
  ListJobsQuerySchema,
  TransitionJobRequest,
  TransitionJobRequestSchema,
} from "@field-ops/contracts";
import { Router } from "express";
import { requireIdempotencyKey } from "../middleware/idempotency";
import { asyncHandler } from "../middleware/errorHandler";
import { validateBody, validateParams, validateQuery } from "../middleware/validate";
import { createJob, getJob, listJobsPage, transitionJob } from "../services/jobs";

export const jobsRouter = Router();

jobsRouter.get(
  "/",
  validateQuery(ListJobsQuerySchema),
  asyncHandler(async (req, res) => {
    const result = await listJobsPage(req.query as unknown as ListJobsQuery);
    res.json(result);
  }),
);

jobsRouter.get(
  "/:id",
  validateParams(JobIdParamSchema),
  asyncHandler(async (req, res) => {
    const job = await getJob(req.params.id);
    res.json(job);
  }),
);

jobsRouter.post(
  "/",
  requireIdempotencyKey,
  validateBody(CreateJobRequestSchema),
  asyncHandler(async (req, res) => {
    const result = await createJob({
      idempotencyKey: req.idempotencyKey as string,
      body: req.body as CreateJobRequest,
    });
    res.status(result.statusCode).json(result.body);
  }),
);

jobsRouter.post(
  "/:id/transitions",
  validateParams(JobIdParamSchema),
  requireIdempotencyKey,
  validateBody(TransitionJobRequestSchema),
  asyncHandler(async (req, res) => {
    const result = await transitionJob({
      jobId: req.params.id,
      idempotencyKey: req.idempotencyKey as string,
      body: req.body as TransitionJobRequest,
    });
    res.status(result.statusCode).json(result.body);
  }),
);
