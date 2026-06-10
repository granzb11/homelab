"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Alert {
  id: string;
  friendName: string;
  daysSinceSeen: number | null;
  thresholdDays: number;
  friendId: string;
}

export function AlertBanner({ alerts }: { alerts: Alert[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = sessionStorage.getItem("dismissed-alerts");
    if (stored) setDismissed(new Set(JSON.parse(stored)));
  }, []);

  function dismiss(id: string) {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    sessionStorage.setItem("dismissed-alerts", JSON.stringify([...next]));
  }

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {visible.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between bg-gold-tint border border-gold rounded-lg px-4 py-3 text-sm"
        >
          <span className="text-ink">
            You haven&apos;t seen{" "}
            <span className="font-medium">{a.friendName}</span> in{" "}
            {a.daysSinceSeen !== null ? `${a.daysSinceSeen} days` : "a while"}{" "}
            (threshold: {a.thresholdDays}d).{" "}
            <Link
              href={`/hangouts/new?friendId=${a.friendId}`}
              className="underline font-medium text-moss hover:text-moss-dark"
            >
              Log a hangout
            </Link>
          </span>
          <button
            onClick={() => dismiss(a.id)}
            className="ml-4 text-ink-muted hover:text-ink text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
