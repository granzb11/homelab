import type { Metadata } from "next";
import { Spectral, Geist_Mono } from "next/font/google";
import Link from "next/link";
import DarkModeProvider from "@/components/DarkModeProvider";
import "./globals.css";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trip Tracker",
  description: "Plan and manage your big trips",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spectral.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-bg text-ink antialiased">
        <DarkModeProvider>
          <nav className="bg-surface border-b border-ink-faint sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
              <Link href="/" className="font-display text-lg font-semibold text-ink hover:text-moss flex-shrink-0">
                Trip Tracker
              </Link>
              <div className="flex items-center gap-4 sm:gap-6 text-sm text-ink-muted min-w-0">
                <Link href="/trips/new" className="hover:text-ink whitespace-nowrap">New trip</Link>
              </div>
            </div>
          </nav>
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
        </DarkModeProvider>
      </body>
    </html>
  );
}
