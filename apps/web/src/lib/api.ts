import {
  CreateJobRequest,
  Job,
  JobStatus,
  JobWithEvents,
  ListJobsResponse,
  ListWorkersResponse,
  TransitionJobRequest,
  Worker,
} from "@field-ops/contracts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/backend";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
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
  return fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
  });
}

export async function listWorkers(signal?: AbortSignal): Promise<Worker[]> {
  const response = await apiFetch("/workers", { signal });
  const body = await parseJson<ListWorkersResponse>(response);
  return body.data;
}

export async function listJobs(
  params: { workerId?: string; status?: JobStatus; limit?: number },
  signal?: AbortSignal,
): Promise<Job[]> {
  const search = new URLSearchParams();
  if (params.workerId) search.set("workerId", params.workerId);
  if (params.status) search.set("status", params.status);
  search.set("limit", String(params.limit ?? 50));
  const response = await apiFetch(`/jobs?${search.toString()}`, { signal });
  const body = await parseJson<ListJobsResponse>(response);
  return body.data;
}

export async function getJob(id: string, signal?: AbortSignal): Promise<JobWithEvents> {
  const response = await apiFetch(`/jobs/${id}`, { signal });
  return parseJson<JobWithEvents>(response);
}

export async function createJob(body: CreateJobRequest): Promise<JobWithEvents> {
  const response = await apiFetch("/jobs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
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
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
  return parseJson<JobWithEvents>(response);
}
