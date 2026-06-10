import type { Metadata } from "next";
import { Spectral, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Friend Tracker",
  description: "Track hangouts with your friends",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spectral.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-white text-ink antialiased">
        <nav className="bg-white border-b border-ink-faint sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="font-display italic text-lg font-semibold text-ink hover:text-moss flex-shrink-0">
              Friend Tracker
            </Link>
            <div className="flex items-center gap-4 sm:gap-6 text-sm text-ink-muted min-w-0 overflow-x-auto">
              <Link href="/friends" className="hover:text-ink whitespace-nowrap">Friends</Link>
              <Link href="/hangouts/new" className="hover:text-ink whitespace-nowrap hidden sm:inline">Log hangout</Link>
              <Link href="/reminders" className="hover:text-ink whitespace-nowrap hidden sm:inline">Reminders</Link>
              <Link href="/map" className="hover:text-ink whitespace-nowrap hidden sm:inline">Map</Link>
              <Link href="/recap" className="hover:text-ink whitespace-nowrap">Recap</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
