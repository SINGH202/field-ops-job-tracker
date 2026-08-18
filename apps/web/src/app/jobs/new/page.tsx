"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Worker } from "@field-ops/contracts";
import { PageShell } from "../../../components/layout/PageShell";
import { Typography } from "../../../components/Typography";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ErrorState } from "../../../components/ui/EmptyState";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { ApiError, createJob, listWorkers } from "../../../lib/api";

const DISPATCHER_ID = "dispatcher-1";

export default function NewJobPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [workerError, setWorkerError] = useState<string | undefined>();

  useEffect(() => {
    const controller = new AbortController();
    listWorkers(controller.signal)
      .then((data) => {
        setWorkers(data);
        if (data[0]) setWorkerId(data[0].id);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("We couldn't load workers right now.");
      });
    return () => controller.abort();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextTitleError = title.trim() ? undefined : "Title is required.";
    const nextWorkerError = workerId ? undefined : "Select a worker.";
    setTitleError(nextTitleError);
    setWorkerError(nextWorkerError);
    if (nextTitleError || nextWorkerError) return;

    setSubmitting(true);
    setError(null);
    try {
      const job = await createJob({
        title,
        description: description || undefined,
        address: address || undefined,
        workerId,
        actorId: DISPATCHER_ID,
      });
      router.push(`/jobs/${job.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "Could not create the job. Try again.";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="max-w-xl">
        <Typography variant="h2">Create new job</Typography>
        <Typography variant="small" className="mt-1">
          Create and assign work to a field worker.
        </Typography>

        <Card className="mt-5">
          <Typography variant="h3">Job details</Typography>
          <form className="mt-4 space-y-4" onSubmit={onSubmit} noValidate>
            <Input
              id="title"
              name="title"
              label="Title"
              required
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (titleError) setTitleError(undefined);
              }}
              maxLength={200}
              placeholder="e.g. Replace rooftop HVAC filter"
              error={titleError}
            />
            <Input
              id="address"
              name="address"
              label="Address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              maxLength={500}
              placeholder="Street, city"
            />
            <Textarea
              id="description"
              name="description"
              label="Description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              placeholder="Optional notes for the worker"
            />
            <Select
              id="workerId"
              name="workerId"
              label="Assign worker"
              required
              value={workerId}
              onChange={(event) => {
                setWorkerId(event.target.value);
                if (workerError) setWorkerError(undefined);
              }}
              error={workerError}
            >
              {workers.length === 0 ? <option value="">Loading workers…</option> : null}
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </Select>
            {error ? (
              <ErrorState title="Could not create job" description={error} />
            ) : null}
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-surface-muted px-4 text-ink transition duration-150 ease-out hover:bg-border"
              >
                <Typography variant="button">Cancel</Typography>
              </Link>
              <Button type="submit" disabled={submitting} className="sm:min-w-40">
                {submitting ? "Creating…" : "Create and assign"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
