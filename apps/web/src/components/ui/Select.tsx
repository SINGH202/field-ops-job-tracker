import type { SelectHTMLAttributes } from "react";
import { Typography } from "../Typography";
import { cn } from "../../lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export function Select({
  label,
  error,
  id,
  className,
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;
  const errorId = error && selectId ? `${selectId}-error` : undefined;
  return (
    <label htmlFor={selectId} className="flex min-w-0 flex-col gap-1.5">
      <Typography variant="small" className="font-medium text-ink-secondary">
        {label}
      </Typography>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          "min-h-11 w-full rounded-md border bg-white px-3 text-sm text-ink",
          "transition duration-150 ease-out",
          error ? "border-danger" : "border-border hover:border-ink-muted",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <Typography variant="small" id={errorId} className="text-danger">
          {error}
        </Typography>
      ) : null}
    </label>
  );
}
