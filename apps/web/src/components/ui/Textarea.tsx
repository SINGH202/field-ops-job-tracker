import type { TextareaHTMLAttributes } from "react";
import { Typography } from "../Typography";
import { cn } from "../../lib/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function Textarea({ label, error, id, className, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;
  const errorId = error && textareaId ? `${textareaId}-error` : undefined;
  return (
    <label htmlFor={textareaId} className="flex min-w-0 flex-col gap-1.5">
      <Typography variant="small" className="font-medium text-ink-secondary">
        {label}
      </Typography>
      <textarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          "min-h-28 w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted",
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
