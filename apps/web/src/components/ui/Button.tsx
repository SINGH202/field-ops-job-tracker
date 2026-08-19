"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Typography } from "../Typography";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary shadow hover:bg-primary-hover",
        primary: "bg-primary text-on-primary shadow hover:bg-primary-hover",
        destructive: "bg-danger text-on-primary shadow-sm hover:bg-danger-hover",
        danger: "bg-danger-soft text-danger shadow-sm hover:bg-danger hover:text-on-primary",
        outline:
          "border border-border bg-surface shadow-sm hover:bg-surface-muted hover:text-ink",
        secondary: "bg-surface-muted text-ink shadow-sm hover:bg-border",
        ghost: "text-ink-secondary hover:bg-surface-muted hover:text-ink",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 min-h-11 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    children: ReactNode;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const content =
    asChild || typeof children !== "string" ? (
      children
    ) : (
      <Typography variant="button">{children}</Typography>
    );

  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {content}
    </Comp>
  );
}

export { buttonVariants };
