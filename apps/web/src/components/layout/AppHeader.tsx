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

function isCurrentNavItem(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visibleNav = NAV.filter((item) => !isCurrentNavItem(pathname, item.href));

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <div className="mx-auto flex min-h-14 max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 rounded-sm py-2">
          <Typography variant="h1">Field Ops</Typography>
        </Link>
        {visibleNav.length > 0 ? (
          <nav
            className="hidden items-center gap-1 md:gap-2.5 md:flex"
            aria-label="Primary">
            {visibleNav.map((item) => {
              const isPrimary = item.href === "/jobs/new";
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isPrimary ? "default" : "ghost"}>
                  <Link href={item.href}>
                    <Typography variant={isPrimary ? "button" : "link"}>
                      {item.label}
                    </Typography>
                  </Link>
                </Button>
              );
            })}
          </nav>
        ) : null}
        {visibleNav.length > 0 ? (
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
        ) : null}
      </div>
      {open && visibleNav.length > 0 ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-border px-4 py-2 md:hidden">
          {visibleNav.map((item) => {
            const isPrimary = item.href === "/jobs/new";
            return (
              <Button
                key={item.href}
                asChild
                variant={isPrimary ? "default" : "ghost"}
                className="mb-1 w-full justify-start">
                <Link href={item.href} onClick={() => setOpen(false)}>
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
