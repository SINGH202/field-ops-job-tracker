import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans } from "next/font/google";
import { AppHeader } from "../components/layout/AppHeader";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

export const metadata: Metadata = {
  title: "Field Ops Job Tracker",
  description: "Dispatcher dashboard for field jobs",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={plex.variable}>
      <body className="font-sans antialiased">
        <AppHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
