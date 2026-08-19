"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Job, JobStatus, isLegalTransition, isTerminal } from "@field-ops/contracts";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { BOARD_STATUSES } from "../../lib/status";
import { JobCard } from "./JobCard";

export type JobDragData = {
  job: Job;
};

function isJobStatus(value: string | number | undefined | null): value is JobStatus {
  return BOARD_STATUSES.some((status) => status === value);
}

export function JobBoardDnd({
  children,
  workerNameById,
  onMove,
  onRejectedDrop,
}: {
  children: ReactNode;
  workerNameById: Record<string, string>;
  onMove: (job: Job, toStatus: JobStatus) => Promise<void>;
  onRejectedDrop: (fromStatus: JobStatus, toStatus: JobStatus) => void;
}) {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const job = (event.active.data.current as JobDragData | undefined)?.job ?? activeJob;
    const overId = event.over?.id;
    setActiveJob(null);
    if (!job || !isJobStatus(overId) || overId === job.status) return;
    if (!isLegalTransition(job.status, overId)) {
      onRejectedDrop(job.status, overId);
      return;
    }
    await onMove(job, overId);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const job = (event.active.data.current as JobDragData | undefined)?.job;
        setActiveJob(job ?? null);
      }}
      onDragCancel={() => setActiveJob(null)}
      onDragEnd={(event) => void handleDragEnd(event)}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeJob ? (
          <div className="w-64 rotate-1 shadow-lg">
            <JobCard
              job={activeJob}
              workerName={workerNameById[activeJob.workerId] ?? "Unknown worker"}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function DraggableJobCard({
  job,
  workerName,
  showStatus,
}: {
  job: Job;
  workerName: string;
  showStatus?: boolean;
}) {
  const disabled = isTerminal(job.status);
  const router = useRouter();
  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: job.id,
    data: { job } satisfies JobDragData,
    disabled,
  });
  const suppressClickRef = useRef(false);

  if (isDragging) {
    suppressClickRef.current = true;
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-full shrink-0 select-none",
        !disabled && "cursor-grab active:cursor-grabbing",
        isDragging && "cursor-grabbing opacity-40",
      )}
      {...(disabled ? {} : listeners)}
      onClick={(event) => {
        if (suppressClickRef.current) {
          event.preventDefault();
          event.stopPropagation();
          suppressClickRef.current = false;
          return;
        }
        if ((event.target as HTMLElement).closest("a")) return;
        router.push(`/jobs/${job.id}`);
      }}
    >
      <JobCard job={job} workerName={workerName} showStatus={showStatus} />
    </div>
  );
}

export function DroppableStatus({
  status,
  children,
  className,
}: {
  status: JobStatus;
  children: ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver, active } = useDroppable({ id: status });
  const fromJob = (active?.data.current as JobDragData | undefined)?.job;
  const legal =
    !fromJob || fromJob.status === status || isLegalTransition(fromJob.status, status);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        isOver && fromJob && legal && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isOver && fromJob && !legal && "ring-2 ring-danger ring-offset-2 ring-offset-background",
      )}
    >
      {children}
    </div>
  );
}
