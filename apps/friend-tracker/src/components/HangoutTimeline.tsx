import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { EventActions } from "@/components/EventActions";

interface FriendEvent {
  id: string;
  title: string | null;
  startDate: string;
  endDate: string | null;
  eventType: string | null;
  location: string | null;
  city: string | null;
  whoTraveled: string | null;
  notes: string | null;
  friends: { id: string; name: string }[];
}

function dateRange(start: string, end: string | null): string {
  if (!end) return formatDate(start);
  const s = new Date(start);
  const e = new Date(end);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function HangoutTimeline({ events, currentFriendId }: { events: FriendEvent[]; currentFriendId: string }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-muted py-4">No events recorded yet.</p>;
  }

  return (
    <ol className="relative border-l border-ink-faint space-y-6 ml-2">
      {events.map((ev) => {
        const others = ev.friends.filter((f) => f.id !== currentFriendId);
        return (
          <li key={ev.id} className="ml-4">
            <div
              className="absolute w-2 h-2 bg-moss rounded-full -left-1 mt-1.5"
              style={{ boxShadow: "0 0 0 3px oklch(1 0 0)" }}
            />
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <time className="text-sm font-medium text-ink">
                    {dateRange(ev.startDate, ev.endDate)}
                  </time>
                  {ev.eventType && (
                    <span className="text-xs bg-moss/10 text-moss px-2 py-0.5 rounded-full">{ev.eventType}</span>
                  )}
                </div>
                {ev.title && (
                  <p className="text-sm font-medium text-ink mt-0.5">{ev.title}</p>
                )}
                {(ev.location || ev.city) && (
                  <p className="text-xs text-ink-muted mt-0.5">
                    {[ev.location, ev.city].filter(Boolean).join(" · ")}
                  </p>
                )}
                {others.length > 0 && (
                  <p className="text-xs text-ink-muted mt-0.5">
                    Also: {others.map((f) => f.name).join(", ")}
                  </p>
                )}
                {ev.notes && (
                  <p className="text-sm text-ink-muted mt-1.5 italic">{ev.notes}</p>
                )}
              </div>
              <EventActions id={ev.id} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
