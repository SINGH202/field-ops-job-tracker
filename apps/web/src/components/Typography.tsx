import type { ReactNode } from "react";
import { cn } from "../lib/cn";

const VARIANT_TAGS = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  bodyMedium: "p",
  small: "small",
  li: "li",
  button: "span",
  link: "span",
} as const;

const VARIANT_CLASS: Record<keyof typeof VARIANT_TAGS, string> = {
  h1: "m-0 text-base font-bold tracking-tight text-ink sm:text-lg",
  h2: "m-0 text-lg font-semibold tracking-tight text-ink sm:text-xl",
  h3: "m-0 text-sm font-semibold text-ink",
  bodyMedium: "m-0 text-sm leading-6 text-ink-secondary",
  small: "m-0 text-xs leading-5 text-ink-muted",
  li: "m-0 text-sm leading-6 text-ink-secondary",
  button: "text-sm font-semibold",
  link: "text-sm font-semibold",
};

type TypographyProps = {
  variant: keyof typeof VARIANT_TAGS;
  className?: string;
  id?: string;
  children: ReactNode;
};

export function Typography({ variant, className, id, children }: TypographyProps) {
  const Tag = VARIANT_TAGS[variant];
  return (
    <Tag id={id} className={cn(VARIANT_CLASS[variant], className)}>
      {children}
    </Tag>
  );
}
