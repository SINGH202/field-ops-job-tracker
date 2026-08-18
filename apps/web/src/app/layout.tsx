import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { Typography } from "../components/Typography";

export const metadata: Metadata = {
  title: "Field Ops Job Tracker",
  description: "Dispatcher dashboard for field jobs",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="topbar-brand">
            <Typography variant="h1">Field Ops</Typography>
          </Link>
          <nav className="topbar-nav">
            <Link href="/">
              <Typography variant="link">Board</Typography>
            </Link>
            <Link href="/jobs/new" className="button button-primary">
              <Typography variant="button">Create job</Typography>
            </Link>
          </nav>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
