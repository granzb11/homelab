"use client";

import { useState } from "react";
import type { Friend } from "@/lib/friends";
import { TYPE_COLORS, BOOKING_COLORS } from "@/components/ReservationsList";

type Reservation = {
  id: string;
  type: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  startLocation: string | null;
  endLocation: string | null;
  city: string | null;
  state: string | null;
  color: string | null;
  participants: { friendId: string }[];
};

function cityState(r: Reservation): string | null {
  const parts = [r.city, r.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function chipColor(r: Reservation): string {
  if (r.color) {
    const bc = BOOKING_COLORS.find((c) => c.id === r.color);
    if (bc) return bc.card;
  }
  return TYPE_COLORS[r.type] ?? "bg-panel border-ink-faint";
}

export default function CalendarView({
  reservations,
  friendMap,
}: {
  reservations: Reservation[];
  friendMap: Record<string, Friend>;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (reservations.length === 0) {
    return (
      <div className="border border-ink-faint p-12 text-center">
        <p className="font-display italic text-2xl text-ink-muted">No reservations to display</p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const minDate = reservations.reduce((min, r) => {
    if (!r.startDate) return min;
    const d = r.startDate.slice(0, 10);
    return d < min ? d : min;
  }, (reservations[0]?.startDate || today).slice(0, 10));

  const maxDate = reservations.reduce((max, r) => {
    const d = (r.endDate || r.startDate)?.slice(0, 10);
    if (!d) return max;
    return d > max ? d : max;
  }, (reservations[0]?.endDate || reservations[0]?.startDate || today).slice(0, 10));

  const startDate = new Date(minDate + "T00:00:00Z");
  const endDate = new Date(maxDate + "T00:00:00Z");

  const days: Map<string, Reservation[]> = new Map();
  for (const r of reservations) {
    if (!r.startDate) continue;
    const d = new Date(r.startDate.slice(0, 10) + "T00:00:00Z");
    if (r.type === "HOTEL" || r.type === "AIRBNB") {
      const end = r.endDate ? new Date(r.endDate.slice(0, 10) + "T00:00:00Z") : d;
      const cur = new Date(d);
      while (cur <= end) {
        const key = cur.toISOString().slice(0, 10);
        if (!days.has(key)) days.set(key, []);
        days.get(key)!.push(r);
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    } else {
      const key = d.toISOString().slice(0, 10);
      if (!days.has(key)) days.set(key, []);
      days.get(key)!.push(r);
    }
  }

  const cur = new Date(startDate);
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];

  while (cur.getUTCDay() !== 0) cur.setUTCDate(cur.getUTCDate() - 1);

  while (cur <= endDate) {
    week.push(new Date(cur));
    if (cur.getUTCDay() === 6) {
      weeks.push(week);
      week = [];
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-mono text-ink-muted py-2">
            {day}
          </div>
        ))}
        {weeks.map((week, wi) =>
          week.map((date, di) => {
            const key = date ? date.toISOString().slice(0, 10) : null;
            if (!date || !key) {
              return <div key={`${wi}-${di}`} className="aspect-square" />;
            }
            const items = days.get(key) || [];
            const isSelected = key === selectedDate;
            return (
              <button
                key={`${wi}-${di}`}
                onClick={() => setSelectedDate(isSelected ? null : key)}
                className={`aspect-square p-1.5 border text-xs flex flex-col items-stretch text-left overflow-hidden ${
                  isSelected ? "border-moss bg-moss/5" : "border-ink-faint hover:border-ink-muted"
                }`}
              >
                <div className="font-mono text-ink mb-1">{date.getUTCDate()}</div>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {items.slice(0, 3).map((r) => {
                    const label = cityState(r);
                    const color = chipColor(r);
                    return label ? (
                      <span
                        key={r.id}
                        className={`truncate rounded-sm border px-1 py-0.5 text-ink/80 text-[10px] leading-tight ${color}`}
                        title={label}
                      >
                        {label}
                      </span>
                    ) : (
                      <span
                        key={r.id}
                        className={`w-2 h-2 rounded-sm border inline-block ${color}`}
                        title={r.title}
                      />
                    );
                  })}
                  {items.length > 3 && (
                    <span className="text-ink-muted text-[10px] px-1">+{items.length - 3} more</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedDate && days.has(selectedDate) && (
        <div className="border p-4 space-y-2">
          <h3 className="font-medium text-ink">
            {new Date(selectedDate + "T00:00:00Z").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>
          {days.get(selectedDate)!.map((r) => (
            <div key={r.id} className="text-sm text-ink-muted p-2 bg-panel border border-ink-faint">
              <span className="font-medium text-ink">{r.title}</span>
              <span className="text-xs ml-2">{r.type.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
