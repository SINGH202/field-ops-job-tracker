import { Typography } from "../Typography";
import { Button } from "./Button";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-1 py-6 text-center">
      <Typography variant="h3">{title}</Typography>
      <Typography variant="small" className="mt-1">
        {description}
      </Typography>
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-4"
    >
      <Typography variant="h3" className="text-danger">
        {title}
      </Typography>
      <Typography variant="small" className="mt-1 text-danger">
        {description}
      </Typography>
      {onRetry ? (
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
