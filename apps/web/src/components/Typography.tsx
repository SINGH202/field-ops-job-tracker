import type { ReactNode } from "react";

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
  h1: "type-h1",
  h2: "type-h2",
  h3: "type-h3",
  bodyMedium: "type-body",
  small: "type-small",
  li: "type-li",
  button: "type-button",
  link: "type-link",
};

type TypographyProps = {
  variant: keyof typeof VARIANT_TAGS;
  className?: string;
  children: ReactNode;
};

export function Typography({ variant, className, children }: TypographyProps) {
  const Tag = VARIANT_TAGS[variant];
  const classes = [VARIANT_CLASS[variant], className].filter(Boolean).join(" ");
  return <Tag className={classes}>{children}</Tag>;
}
