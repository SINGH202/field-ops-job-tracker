import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

function databaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.RENDER) {
    throw new Error(
      "DATABASE_URL is not set. On the Render web service, add DATABASE_URL from the Postgres Internal Database URL.",
    );
  }
  return "postgres://fieldops:fieldops@localhost:5433/fieldops";
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: databaseUrl(),
  testDatabaseUrl:
    process.env.TEST_DATABASE_URL ??
    "postgres://fieldops:fieldops@localhost:5433/fieldops_test",
};
