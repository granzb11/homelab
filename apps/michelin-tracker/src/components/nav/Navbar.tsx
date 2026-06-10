"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/map", label: "Map" },
  { href: "/import", label: "Import" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[--color-border] bg-[--color-surface]">
      <div className="container mx-auto px-6 max-w-7xl flex items-center h-14 gap-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-[--color-ink] hover:text-[--color-moss] transition-colors duration-150"
        >
          <span
            className="text-[--color-amber]"
            style={{ fontFamily: "var(--font-fraunces)", fontSize: "1.2rem" }}
          >
            ★
          </span>
          <span
            style={{
              fontFamily: "var(--font-fraunces)",
              fontWeight: 600,
              fontSize: "1rem",
              letterSpacing: "-0.01em",
            }}
          >
            Michelin Tracker
          </span>
        </Link>

        <div className="flex gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150 ${
                pathname === href
                  ? "bg-[--color-moss-light] text-[--color-moss]"
                  : "text-[--color-muted] hover:text-[--color-ink] hover:bg-[--color-panel]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
