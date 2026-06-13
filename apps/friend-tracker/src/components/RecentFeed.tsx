"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { EventActions } from "@/components/EventActions";
import { AvatarStack } from "@/components/AvatarStack";

export interface FeedEvent {
  id: string;
  title: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  eventType: string | null;
  city: string | null;
  location: string | null;
  notes: string | null;
  friends: { id: string; name: string; avatarUrl: string | null }[];
}

const EVENT_ICONS: Record<string, string> = {
  Wedding: "💍",
  Birthday: "🎂",
  "Holiday Party": "🎉",
  Dinner: "🍷",
  Lunch: "🥗",
  Coffee: "☕",
  Trip: "✈️",
  Vacation: "🏖️",
  Concert: "🎵",
  "Music Festival": "🎪",
  Other: "🤝",
};

const EVENT_COLORS: Record<string, { bg: string; accent: string; label: string }> = {
  Wedding:        { bg: "bg-rose-50",   accent: "bg-rose-300",   label: "text-rose-700" },
  Birthday:       { bg: "bg-amber-50",  accent: "bg-amber-300",  label: "text-amber-700" },
  "Holiday Party":{ bg: "bg-violet-50", accent: "bg-violet-300", label: "text-violet-700" },
  Dinner:         { bg: "bg-orange-50", accent: "bg-orange-300", label: "text-orange-700" },
  Lunch:          { bg: "bg-lime-50",   accent: "bg-lime-400",   label: "text-lime-700" },
  Coffee:         { bg: "bg-yellow-50", accent: "bg-yellow-400", label: "text-yellow-700" },
  Trip:           { bg: "bg-sky-50",    accent: "bg-sky-300",    label: "text-sky-700" },
  Vacation:       { bg: "bg-teal-50",   accent: "bg-teal-300",   label: "text-teal-700" },
  Concert:        { bg: "bg-purple-50", accent: "bg-purple-300", label: "text-purple-700" },
  "Music Festival":{ bg: "bg-pink-50",  accent: "bg-pink-300",   label: "text-pink-700" },
  Other:          { bg: "bg-moss-tint", accent: "bg-moss",       label: "text-moss" },
};

const DEFAULT_COLORS = { bg: "bg-moss-tint", accent: "bg-moss", label: "text-moss" };
const PAGE_SIZE = 20;

function timeAgo(date: Date | string): string {
  const d2 = new Date(date);
  const now = new Date();
  const today = new Date(now); today.setHours(0,0,0,0);
  const d = new Date(d2); d.setHours(0,0,0,0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays <= 14) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -6) return `${Math.abs(diffDays)} days ago`;
  if (diffDays < -6 && diffDays >= -13) return "Last week";
  if (diffDays < -13 && diffDays >= -27) return `${Math.ceil(Math.abs(diffDays) / 7)} weeks ago`;

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const isSameYear = d2.getFullYear() === now.getFullYear();
  return isSameYear
    ? `${monthNames[d2.getMonth()]} ${d2.getDate()}`
    : `${monthNames[d2.getMonth()]} ${d2.getDate()}, ${d2.getFullYear()}`;
}

function EventCard({ ev }: { ev: FeedEvent }) {
  const icon = ev.eventType ? (EVENT_ICONS[ev.eventType] ?? "🤝") : "🤝";
  const colors = ev.eventType ? (EVENT_COLORS[ev.eventType] ?? DEFAULT_COLORS) : DEFAULT_COLORS;
  const place = [ev.location, ev.city].filter(Boolean).join(" · ");

  return (
    <li className={`relative flex gap-0 rounded-2xl border border-ink-faint ${colors.bg} hover:shadow-sm transition-shadow`}>
      <div className={`w-1 shrink-0 rounded-l-2xl ${colors.accent}`} />
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/hangouts/${ev.id}`} className="flex items-start gap-3 min-w-0 flex-1 group">
            <span className="text-2xl leading-none mt-0.5 select-none">{icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {ev.eventType && (
                  <span className={`text-sm font-semibold font-display ${colors.label} group-hover:underline`}>
                    {ev.eventType}
                  </span>
                )}
              </div>
              {ev.title && ev.eventType !== "Hotel" && ev.eventType !== "Airbnb" && (
                <p className="text-sm font-medium text-ink mt-0.5">{ev.title}</p>
              )}
              {place && (
                <p className="text-xs text-ink-muted mt-0.5">{place}</p>
              )}
              {ev.notes && (
                <p className="text-xs text-ink-muted mt-1 italic line-clamp-2">{ev.notes}</p>
              )}
              {ev.friends.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <AvatarStack friends={ev.friends} />
                  <span className="text-[11px] text-ink-muted tabular-nums">
                    {ev.friends.length === 1 ? "1 friend" : `${ev.friends.length} friends`}
                  </span>
                </div>
              )}
            </div>
          </Link>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-ink-muted">{timeAgo(ev.startDate)}</span>
            <EventActions id={ev.id} />
          </div>
        </div>
      </div>
    </li>
  );
}

export function RecentFeed({
  initialEvents,
  initialTotal,
}: {
  initialEvents: FeedEvent[];
  initialTotal: number;
}) {
  const [events, setEvents] = useState<FeedEvent[]>(initialEvents);
  const [total, setTotal] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();

  const hasMore = events.length < total;

  function loadMore() {
    startTransition(async () => {
      const res = await fetch(`/api/events?skip=${events.length}&take=${PAGE_SIZE}`);
      const data = await res.json();
      setEvents((prev) => [...prev, ...data.events]);
      setTotal(data.total);
    });
  }

  if (events.length === 0) {
    return <p className="text-sm text-ink-muted py-2">No hangouts logged yet.</p>;
  }

  return (
    <div>
      <ol className="space-y-3">
        {events.map((ev) => (
          <EventCard key={ev.id} ev={ev} />
        ))}
      </ol>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={isPending}
          className="mt-4 w-full py-2.5 rounded-xl border border-ink-faint text-sm text-ink-muted hover:border-moss hover:text-moss transition-colors disabled:opacity-50"
        >
          {isPending
            ? "Loading…"
            : `Load more · ${total - events.length} remaining`}
        </button>
      )}

      {!hasMore && total > PAGE_SIZE && (
        <p className="mt-4 text-center text-xs text-ink-muted">All {total} hangouts loaded</p>
      )}
    </div>
  );
}
