import { JobStatus } from "@field-ops/contracts";
import { Typography } from "../Typography";
import { cn } from "../../lib/cn";
import { STATUS_BADGE_CLASS, STATUS_DOT_CLASS, STATUS_LABEL } from "../../lib/status";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Typography
      variant="small"
      className={cn(
        "inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold",
        STATUS_BADGE_CLASS[status],
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT_CLASS[status])}
      />
      {STATUS_LABEL[status]}
    </Typography>
  );
}
