import { Worker } from "@field-ops/contracts";
import { getPool } from "../db/pool";
import { listWorkers } from "../repos/workers";

export async function getWorkers(): Promise<Worker[]> {
  const client = await getPool().connect();
  try {
    return await listWorkers(client);
  } finally {
    client.release();
  }
}
