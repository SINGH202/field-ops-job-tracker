import cors from "cors";
import express, { Express } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { jobsRouter } from "./routes/jobs";
import { workersRouter } from "./routes/workers";

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/jobs", jobsRouter);
  app.use("/workers", workersRouter);
  app.use(errorHandler);
  return app;
}
