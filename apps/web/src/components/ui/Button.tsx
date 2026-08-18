import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Typography } from "../Typography";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover disabled:bg-primary/60",
  secondary:
    "bg-surface-muted text-ink hover:bg-border disabled:text-ink-muted",
  danger:
    "bg-danger-soft text-danger hover:bg-danger hover:text-on-primary disabled:opacity-60",
  ghost: "bg-transparent text-ink-secondary hover:bg-surface-muted disabled:text-ink-muted",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-md px-4 transition duration-150 ease-out disabled:cursor-not-allowed",
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    >
      <Typography variant="button">{children}</Typography>
    </button>
  );
}
