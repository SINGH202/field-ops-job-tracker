"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Worker } from "@field-ops/contracts";
import { Typography } from "../../../components/Typography";
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

  useEffect(() => {
    const controller = new AbortController();
    listWorkers(controller.signal)
      .then((data) => {
        setWorkers(data);
        if (data[0]) setWorkerId(data[0].id);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load workers");
      });
    return () => controller.abort();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
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
        err instanceof ApiError ? err.message : "Could not create the job";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="stack">
      <Typography variant="h2">Create and assign a job</Typography>
      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <Typography variant="small">Title</Typography>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
          />
        </label>
        <label className="field">
          <Typography variant="small">Address</Typography>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            maxLength={500}
          />
        </label>
        <label className="field">
          <Typography variant="small">Description</Typography>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
          />
        </label>
        <label className="field">
          <Typography variant="small">Assign to</Typography>
          <select
            required
            value={workerId}
            onChange={(event) => setWorkerId(event.target.value)}
          >
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name}
              </option>
            ))}
          </select>
        </label>
        {error ? (
          <Typography variant="bodyMedium" className="error">
            {error}
          </Typography>
        ) : null}
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={submitting}>
            <Typography variant="button">
              {submitting ? "Creating…" : "Create job"}
            </Typography>
          </button>
        </div>
      </form>
    </div>
  );
}
