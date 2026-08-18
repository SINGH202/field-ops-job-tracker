import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-surface p-4 shadow-card sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
