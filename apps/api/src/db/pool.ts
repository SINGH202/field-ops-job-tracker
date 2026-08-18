import { Pool, PoolClient } from "pg";
import { config } from "../config";

let pool: Pool | undefined;

export function getPool(connectionString = config.databaseUrl): Pool {
  if (!pool) {
    pool = new Pool({ connectionString });
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
