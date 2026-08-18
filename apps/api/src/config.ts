import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://fieldops:fieldops@localhost:5433/fieldops",
  testDatabaseUrl:
    process.env.TEST_DATABASE_URL ??
    "postgres://fieldops:fieldops@localhost:5433/fieldops_test",
};
