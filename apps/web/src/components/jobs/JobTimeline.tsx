import { JobEvent } from "@field-ops/contracts";
import { Typography } from "../Typography";
import { JobStatusBadge } from "./JobStatusBadge";
import { cn } from "../../lib/cn";
import { formatTimestamp, STATUS_DOT_CLASS } from "../../lib/status";

export function JobTimeline({ events }: { events: JobEvent[] }) {
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <li key={event.id} className="flex gap-3">
            <div className="flex w-4 flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                  STATUS_DOT_CLASS[event.toStatus],
                )}
              />
              {isLast ? null : (
                <span aria-hidden="true" className="mt-1 w-px flex-1 bg-border" />
              )}
            </div>
            <div className={cn("min-w-0 pb-5", isLast && "pb-0")}>
              <JobStatusBadge status={event.toStatus} />
              <Typography variant="small" className="mt-1 block">
                {formatTimestamp(event.occurredAt)}
              </Typography>
              <Typography variant="small" className="block">
                {event.actorType === "DISPATCHER" ? "Dispatcher" : "Worker"} {event.actorId}
                {event.note ? ` — ${event.note}` : ""}
              </Typography>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
