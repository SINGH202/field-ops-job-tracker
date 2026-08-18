import { PoolClient } from "pg";

export type IdempotencyRecord = {
  key: string;
  method: string;
  path: string;
  requestHash: string;
  responseStatus: number;
  responseBody: unknown;
};

export async function getIdempotencyRecord(
  client: PoolClient,
  key: string,
): Promise<IdempotencyRecord | null> {
  const result = await client.query<{
    key: string;
    method: string;
    path: string;
    request_hash: string;
    response_status: number;
    response_body: unknown;
  }>(
    `SELECT key, method, path, request_hash, response_status, response_body
     FROM idempotency_keys
     WHERE key = $1`,
    [key],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    key: row.key,
    method: row.method,
    path: row.path,
    requestHash: row.request_hash,
    responseStatus: row.response_status,
    responseBody: row.response_body,
  };
}

export async function insertIdempotencyRecord(
  client: PoolClient,
  record: IdempotencyRecord,
): Promise<"inserted" | "conflict"> {
  try {
    await client.query(
      `INSERT INTO idempotency_keys (
         key, method, path, request_hash, response_status, response_body
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        record.key,
        record.method,
        record.path,
        record.requestHash,
        record.responseStatus,
        JSON.stringify(record.responseBody),
      ],
    );
    return "inserted";
  } catch (error) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return "conflict";
    }
    throw error;
  }
}
