"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Job, JobStatus } from "@field-ops/contracts";
import { listJobs } from "../lib/api";
import { BOARD_STATUSES } from "../lib/status";

export const PAGE_SIZE = 20;
const POLL_MS = 4000;
const MAX_LIMIT = 100;

export type BoardColumn = {
  jobs: Job[];
  nextCursor: string | null;
  loadingMore: boolean;
  loadMoreError: string | null;
};

export type BoardColumns = Record<JobStatus, BoardColumn>;

function emptyColumn(): BoardColumn {
  return {
    jobs: [],
    nextCursor: null,
    loadingMore: false,
    loadMoreError: null,
  };
}

function emptyColumns(): BoardColumns {
  return Object.fromEntries(BOARD_STATUSES.map((status) => [status, emptyColumn()])) as BoardColumns;
}

function emptyLoadingMore(): Record<JobStatus, boolean> {
  return Object.fromEntries(BOARD_STATUSES.map((status) => [status, false])) as Record<
    JobStatus,
    boolean
  >;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function anyLoadingMore(flags: Record<JobStatus, boolean>): boolean {
  return BOARD_STATUSES.some((status) => flags[status]);
}

export function useJobBoard(workerId: string): {
  columns: BoardColumns;
  loading: boolean;
  error: string | null;
  live: boolean;
  updatedAt: Date | null;
  refresh: (silent?: boolean) => Promise<void>;
  loadMore: (status: JobStatus) => Promise<void>;
} {
  const [columns, setColumns] = useState<BoardColumns>(emptyColumns);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const refreshAbortRef = useRef<AbortController | null>(null);
  const loadMoreAbortsRef = useRef(new Set<AbortController>());
  const loadingMoreRef = useRef<Record<JobStatus, boolean>>(emptyLoadingMore());
  const generationRef = useRef(0);
  const listVersionRef = useRef(0);
  const pollEpochRef = useRef(0);
  const pollInFlightEpochRef = useRef<number | null>(null);

  const abortLoadMores = useCallback(() => {
    for (const controller of loadMoreAbortsRef.current) {
      controller.abort();
    }
    loadMoreAbortsRef.current.clear();
    loadingMoreRef.current = emptyLoadingMore();
  }, []);

  const refresh = useCallback(
    async (silent = false) => {
      const generation = generationRef.current;

      if (silent) {
        if (pollInFlightEpochRef.current !== null) return;
        if (anyLoadingMore(loadingMoreRef.current)) return;

        const epoch = pollEpochRef.current + 1;
        pollEpochRef.current = epoch;
        pollInFlightEpochRef.current = epoch;

        const signal = refreshAbortRef.current?.signal;
        const version = listVersionRef.current;
        const snapshot = columnsRef.current;

        try {
          const pages = await Promise.all(
            BOARD_STATUSES.map(async (status) => {
              const limit = Math.min(MAX_LIMIT, Math.max(PAGE_SIZE, snapshot[status].jobs.length));
              const page = await listJobs(
                {
                  status,
                  workerId: workerId || undefined,
                  limit,
                },
                signal,
              );
              return { status, page };
            }),
          );

          if (generationRef.current !== generation) return;
          if (signal?.aborted) return;
          if (anyLoadingMore(loadingMoreRef.current)) return;
          if (listVersionRef.current !== version) return;

          setColumns((prev) => {
            const next = emptyColumns();
            for (const { status, page } of pages) {
              next[status] = {
                jobs: page.data,
                nextCursor: page.nextCursor,
                loadingMore: prev[status].loadingMore,
                loadMoreError: prev[status].loadMoreError,
              };
            }
            return next;
          });
          setError(null);
          setLive(true);
          setUpdatedAt(new Date());
        } catch (err: unknown) {
          if (isAbortError(err) || generationRef.current !== generation) return;
          setLive(false);
        } finally {
          if (pollInFlightEpochRef.current === epoch) {
            pollInFlightEpochRef.current = null;
          }
        }
        return;
      }

      abortLoadMores();
      const signal = refreshAbortRef.current?.signal;
      setLoading(true);

      try {
        const pages = await Promise.all(
          BOARD_STATUSES.map(async (status) => {
            const page = await listJobs(
              {
                status,
                workerId: workerId || undefined,
                limit: PAGE_SIZE,
              },
              signal,
            );
            return { status, page };
          }),
        );

        if (generationRef.current !== generation || signal?.aborted) return;

        listVersionRef.current += 1;
        setColumns(() => {
          const next = emptyColumns();
          for (const { status, page } of pages) {
            next[status] = {
              jobs: page.data,
              nextCursor: page.nextCursor,
              loadingMore: false,
              loadMoreError: null,
            };
          }
          return next;
        });
        setError(null);
        setLive(true);
        setUpdatedAt(new Date());
      } catch (err: unknown) {
        if (isAbortError(err) || generationRef.current !== generation) return;
        setLive(false);
        setError("We couldn't load the jobs right now.");
      } finally {
        if (generationRef.current === generation && !signal?.aborted) setLoading(false);
      }
    },
    [abortLoadMores, workerId],
  );

  const loadMore = useCallback(
    async (status: JobStatus) => {
      const column = columnsRef.current[status];
      if (!column.nextCursor || loadingMoreRef.current[status]) return;

      const generation = generationRef.current;
      loadingMoreRef.current[status] = true;

      setColumns((prev) => ({
        ...prev,
        [status]: { ...prev[status], loadingMore: true, loadMoreError: null },
      }));

      const controller = new AbortController();
      loadMoreAbortsRef.current.add(controller);

      try {
        const page = await listJobs(
          {
            status,
            workerId: workerId || undefined,
            limit: PAGE_SIZE,
            cursor: column.nextCursor,
          },
          controller.signal,
        );

        if (generationRef.current !== generation) return;
        if (controller.signal.aborted) {
          setColumns((prev) => ({
            ...prev,
            [status]: { ...prev[status], loadingMore: false },
          }));
          return;
        }

        listVersionRef.current += 1;
        setColumns((prev) => {
          const existingIds = new Set(prev[status].jobs.map((job) => job.id));
          return {
            ...prev,
            [status]: {
              ...prev[status],
              jobs: [
                ...prev[status].jobs,
                ...page.data.filter((job) => !existingIds.has(job.id)),
              ],
              nextCursor: page.nextCursor,
              loadingMore: false,
              loadMoreError: null,
            },
          };
        });
      } catch (err: unknown) {
        if (generationRef.current !== generation) return;
        if (isAbortError(err)) {
          setColumns((prev) => ({
            ...prev,
            [status]: { ...prev[status], loadingMore: false },
          }));
          return;
        }
        setColumns((prev) => ({
          ...prev,
          [status]: {
            ...prev[status],
            loadingMore: false,
            loadMoreError: "We couldn't load more jobs.",
          },
        }));
      } finally {
        loadMoreAbortsRef.current.delete(controller);
        if (generationRef.current === generation) {
          loadingMoreRef.current[status] = false;
        }
      }
    },
    [workerId],
  );

  useEffect(() => {
    generationRef.current += 1;
    listVersionRef.current += 1;
    pollEpochRef.current += 1;
    pollInFlightEpochRef.current = null;
    abortLoadMores();

    const controller = new AbortController();
    refreshAbortRef.current = controller;
    void refresh(false);

    const timer = window.setInterval(() => {
      void refresh(true);
    }, POLL_MS);

    return () => {
      generationRef.current += 1;
      pollEpochRef.current += 1;
      pollInFlightEpochRef.current = null;
      controller.abort();
      window.clearInterval(timer);
      abortLoadMores();
    };
  }, [abortLoadMores, refresh, workerId]);

  return { columns, loading, error, live, updatedAt, refresh, loadMore };
}
