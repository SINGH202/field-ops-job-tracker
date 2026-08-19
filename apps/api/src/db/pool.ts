import { Pool, PoolClient } from "pg";
import { config } from "../config";

let pool: Pool | undefined;

export function sslForDatabaseUrl(connectionString: string) {
  const url = new URL(connectionString);
  const sslmode = url.searchParams.get("sslmode");
  if (sslmode === "disable") return undefined;
  if (sslmode === "require" || sslmode === "verify-ca" || sslmode === "verify-full") {
    return { rejectUnauthorized: sslmode !== "require" };
  }

  const host = url.hostname;
  // Local Docker Compose uses hostnames like `postgres` (no SSL). Cloud URLs have a dot.
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    !host.includes(".")
  ) {
    return undefined;
  }
  return { rejectUnauthorized: false };
}

export function createPool(connectionString: string): Pool {
  return new Pool({
    connectionString,
    ssl: sslForDatabaseUrl(connectionString),
  });
}

export function getPool(connectionString = config.databaseUrl): Pool {
  if (!pool) {
    pool = createPool(connectionString);
  }
  return pool;
}

export function setPool(next: Pool): void {
  pool = next;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
