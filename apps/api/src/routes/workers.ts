import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { getWorkers } from "../services/workers";

export const workersRouter = Router();

workersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const workers = await getWorkers();
    res.json({ data: workers });
  }),
);
