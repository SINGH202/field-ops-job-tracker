import { Pool, PoolClient } from "pg";
import { config } from "../config";

let pool: Pool | undefined;

function sslFor(connectionString: string) {
  if (
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1")
  ) {
    return undefined;
  }
  return { rejectUnauthorized: false };
}

export function createPool(connectionString: string): Pool {
  return new Pool({
    connectionString,
    ssl: sslFor(connectionString),
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
