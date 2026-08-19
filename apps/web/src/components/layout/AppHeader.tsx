"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Typography } from "../Typography";
import { Button } from "../ui/Button";

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
        <nav
          className="hidden items-center gap-1 md:gap-2.5 md:flex"
          aria-label="Primary">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const isPrimary = item.href === "/jobs/new";
            return (
              <Button
                key={item.href}
                asChild
                variant={
                  isPrimary ? "default" : active ? "secondary" : "ghost"
                }>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}>
                  <Typography variant={isPrimary ? "button" : "link"}>
                    {item.label}
                  </Typography>
                </Link>
              </Button>
            );
          })}
        </nav>
        <Button
          type="button"
          variant="outline"
          className="md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}>
          {open ? "Close" : "Menu"}
        </Button>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-border px-4 py-2 md:hidden">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const isPrimary = item.href === "/jobs/new";
            return (
              <Button
                key={item.href}
                asChild
                variant={isPrimary ? "default" : active ? "secondary" : "ghost"}
                className="mb-1 w-full justify-start">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}>
                  <Typography variant={isPrimary ? "button" : "link"}>
                    {item.label}
                  </Typography>
                </Link>
              </Button>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
