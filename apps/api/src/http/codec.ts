import { createHash } from "node:crypto";

export function hashRequestBody(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body ?? {})).digest("hex");
}

export function encodeCursor(updatedAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ updatedAt, id }), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): { updatedAt: string; id: string } {
  const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
    updatedAt?: unknown;
    id?: unknown;
  };
  if (typeof parsed.updatedAt !== "string" || typeof parsed.id !== "string") {
    throw new Error("invalid cursor");
  }
  return { updatedAt: parsed.updatedAt, id: parsed.id };
}
