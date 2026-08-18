import { cn } from "../../lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-muted motion-reduce:animate-none",
        className,
      )}
    />
  );
}
