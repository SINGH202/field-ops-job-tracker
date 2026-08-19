import { Platform } from "react-native";
import {
  JobStatus,
  JobWithEvents,
  ListJobsResponse,
  ListWorkersResponse,
  TransitionJobRequest,
  Worker,
} from "@field-ops/contracts";

function defaultApiUrl(): string {
  if (Platform.OS === "android") return "http://10.0.2.2:3001";
  return "http://localhost:3001";
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl();

export function apiBaseUrl(): string {
  return API_URL;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body = {} as T & {
    error?: { code?: string; message?: string };
  };
  if (text) {
    body = JSON.parse(text) as T & {
      error?: { code?: string; message?: string };
    };
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.message ?? `Request failed with ${response.status}`,
    );
  }
  return body;
}

function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, init);
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export { isAbortError };

export async function listWorkers(signal?: AbortSignal): Promise<Worker[]> {
  const response = await apiFetch("/workers", { signal });
  const body = await parseJson<ListWorkersResponse>(response);
  return body.data;
}

export async function listJobs(
  params: {
    workerId: string;
    status?: JobStatus;
    limit?: number;
    cursor?: string;
  },
  signal?: AbortSignal,
): Promise<ListJobsResponse> {
  const search = new URLSearchParams();
  search.set("workerId", params.workerId);
  if (params.status) search.set("status", params.status);
  search.set("limit", String(params.limit ?? 20));
  if (params.cursor) search.set("cursor", params.cursor);
  const response = await apiFetch(`/jobs?${search.toString()}`, { signal });
  return parseJson<ListJobsResponse>(response);
}

export async function getJob(id: string, signal?: AbortSignal): Promise<JobWithEvents> {
  const response = await apiFetch(`/jobs/${id}`, { signal });
  return parseJson<JobWithEvents>(response);
}

export async function transitionJob(
  jobId: string,
  body: TransitionJobRequest,
): Promise<JobWithEvents> {
  const response = await apiFetch(`/jobs/${jobId}/transitions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": newIdempotencyKey(),
    },
    body: JSON.stringify(body),
  });
  return parseJson<JobWithEvents>(response);
}
