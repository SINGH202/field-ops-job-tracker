import type { InputHTMLAttributes } from "react";
import { Typography } from "../Typography";
import { cn } from "../../lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  return (
    <label htmlFor={inputId} className="flex min-w-0 flex-col gap-1.5">
      <Typography variant="small" className="font-medium text-ink-secondary">
        {label}
      </Typography>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          "min-h-11 w-full rounded-md border bg-white px-3 text-sm text-ink placeholder:text-ink-muted",
          "transition duration-150 ease-out",
          error ? "border-danger" : "border-border hover:border-ink-muted",
          className,
        )}
        {...props}
      />
      {error ? (
        <Typography variant="small" id={errorId} className="text-danger">
          {error}
        </Typography>
      ) : null}
    </label>
  );
}
