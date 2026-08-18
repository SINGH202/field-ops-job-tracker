import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { jobsRouter } from "./routes/jobs";
import { workersRouter } from "./routes/workers";

export function createApp(): Express {
  const app = express();
  app.set("etag", false);
  app.use(
    cors({
      origin: true,
      allowedHeaders: ["Content-Type", "Idempotency-Key"],
    }),
  );
  app.use(express.json());
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    const started = Date.now();
    res.on("finish", () => {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
    });
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/jobs", jobsRouter);
  app.use("/workers", workersRouter);
  app.use(errorHandler);
  return app;
}
