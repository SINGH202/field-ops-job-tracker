"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Typography } from "../Typography";
import { cn } from "../../lib/cn";

const NAV = [
  { href: "/", label: "Board" },
  { href: "/jobs/new", label: "New job" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <div className="mx-auto flex min-h-14 max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 rounded-sm py-2">
          <Typography variant="h1">Field Ops</Typography>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const isPrimary = item.href === "/jobs/new";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md px-3 transition duration-150 ease-out",
                  isPrimary
                    ? "bg-primary text-on-primary hover:bg-primary-hover"
                    : active
                      ? "bg-surface-muted text-ink"
                      : "text-ink-secondary hover:bg-surface-muted hover:text-ink",
                )}
              >
                <Typography variant={isPrimary ? "button" : "link"}>
                  {item.label}
                </Typography>
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <Typography variant="button">{open ? "Close" : "Menu"}</Typography>
        </button>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-border px-4 py-2 md:hidden"
        >
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-11 items-center rounded-md px-3",
                  active ? "bg-surface-muted text-ink" : "text-ink-secondary",
                )}
              >
                <Typography variant="link">{item.label}</Typography>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
