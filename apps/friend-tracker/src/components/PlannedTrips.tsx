"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AvatarStack } from "@/components/AvatarStack";

interface TripFriend {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface PlannedTrip {
  id: string;
  title: string | null;
  city: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  friends: TripFriend[];
}

function formatTarget(startDate: string, endDate: string | null): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  const start = new Date(startDate).toLocaleDateString("en-US", opts);
  if (!endDate) return start;
  const end = new Date(endDate).toLocaleDateString("en-US", opts);
  return start === end ? start : `${start} – ${end}`;
}

export function PlannedTrips({ trips }: { trips: PlannedTrip[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (trips.length === 0) return null;

  async function markHappened(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "logged" }),
    });
    if (res.ok) {
      router.push(`/events/${id}/edit`);
      router.refresh();
    } else {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this planned trip?")) return;
    setBusyId(id);
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setBusyId(null);
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {trips.map((t) => {
        const place = t.city || t.location || t.title || "Somewhere";
        const busy = busyId === t.id;
        return (
          <div
            key={t.id}
            className="bg-panel border border-ink-faint rounded-2xl p-4 min-w-[220px] flex-shrink-0 flex flex-col justify-between"
          >
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-gold bg-gold-tint rounded px-1.5 py-0.5 mb-2">
                Planning
              </span>
              <p className="font-display font-semibold text-ink text-base leading-snug">{place}</p>
              <p className="text-xs text-ink-muted mt-0.5">{formatTarget(t.startDate, t.endDate)}</p>
              {t.title && (t.city || t.location) && (
                <p className="text-xs text-ink-muted mt-1">{t.title}</p>
              )}
              {t.notes && (
                <p className="text-xs text-ink-muted mt-2 line-clamp-2">{t.notes}</p>
              )}
              {t.friends.length > 0 && (
                <div className="mt-3">
                  <AvatarStack friends={t.friends} />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => markHappened(t.id)}
                disabled={busy}
                className="flex-1 text-center text-xs bg-moss text-white rounded-xl px-3 py-2 font-medium hover:bg-moss-dark disabled:opacity-50"
              >
                {busy ? "…" : "Mark as happened"}
              </button>
              <Link
                href={`/events/${t.id}/edit`}
                className="text-xs text-ink-muted hover:text-ink px-2 py-2"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => remove(t.id)}
                disabled={busy}
                className="text-xs text-ink-muted hover:text-red-600 px-1 py-2 disabled:opacity-50"
                aria-label="Delete planned trip"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
