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

export function ItsBeenModal({ alerts }: { alerts: Alert[] }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (alerts.length > 0 && !sessionStorage.getItem("modal-dismissed")) {
      setIsOpen(true);
    }
  }, [alerts]);

  function dismiss() {
    sessionStorage.setItem("modal-dismissed", "1");
    setIsOpen(false);
  }

  if (!isOpen || alerts.length === 0) return null;

  const alert = [...alerts].sort((a, b) => {
    const aRatio = (a.daysSinceSeen ?? Infinity) / a.thresholdDays;
    const bRatio = (b.daysSinceSeen ?? Infinity) / b.thresholdDays;
    return bRatio - aRatio;
  })[0];

  const initials = alert.friendName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const others = alerts.length - 1;

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center border border-ink-faint">
        <div className="w-20 h-20 rounded-full bg-moss-tint text-moss font-bold text-2xl font-display italic flex items-center justify-center mx-auto mb-5">
          {initials}
        </div>
        <p className="text-ink-muted text-xs mb-1 uppercase tracking-wide">It's been a while</p>
        <h2 className="text-2xl font-display font-semibold text-ink mb-1">{alert.friendName}</h2>
        <p className="text-ink-muted text-sm mb-1">
          {alert.daysSinceSeen !== null
            ? `${alert.daysSinceSeen} days since your last hangout`
            : "You've never logged a hangout"}
        </p>
        <p className="text-xs text-ink-muted mb-7">
          You set a {alert.thresholdDays}-day reminder
          {others > 0 && ` · and ${others} other${others > 1 ? "s" : ""}`}
        </p>
        <Link
          href={`/hangouts/new?friendId=${alert.friendId}`}
          onClick={dismiss}
          className="block w-full bg-moss text-white py-3 rounded-2xl font-medium text-sm hover:bg-moss-dark mb-3"
        >
          Log a hangout today
        </Link>
        <button
          onClick={dismiss}
          className="text-sm text-ink-muted hover:text-ink"
        >
          Remind me later
        </button>
      </div>
    </div>
  );
}
