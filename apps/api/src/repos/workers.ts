import { Worker } from "@field-ops/contracts";
import { PoolClient } from "pg";

type WorkerRow = {
  id: string;
  name: string;
  created_at: Date;
};

function mapWorker(row: WorkerRow): Worker {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listWorkers(client: PoolClient): Promise<Worker[]> {
  const result = await client.query<WorkerRow>(
    `SELECT id, name, created_at
     FROM workers
     ORDER BY name ASC`,
  );
  return result.rows.map(mapWorker);
}

export async function workerExists(client: PoolClient, workerId: string): Promise<boolean> {
  const result = await client.query("SELECT 1 FROM workers WHERE id = $1", [workerId]);
  return (result.rowCount ?? 0) > 0;
}
