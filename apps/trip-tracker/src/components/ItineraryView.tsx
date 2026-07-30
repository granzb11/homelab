"use client";

import { useState } from "react";
import type { Friend } from "@/lib/friends";
import EventFormModal from "@/components/EventFormModal";
import { EVENT_ICONS, type Event, type EventFormShape } from "@/components/eventFormShared";
import { IconTile, type ItineraryAccent } from "@/components/IconTile";
import { RouteStrip } from "@/components/RouteStrip";
import type { TripCity } from "@/components/TripDetailClient";

const TYPE_TO_ACCENT: Record<string, ItineraryAccent> = {
  HOTEL: "lodging",
  AIRBNB: "lodging",
  FLIGHT: "transit",
  TRAIN: "transit",
  BUS: "transit",
  RENTAL_CAR: "transit",
  RESTAURANT: "food",
  FOOD_TOUR: "food",
  CITY_TOUR: "activity",
  MUSEUM: "activity",
  ACTIVITY: "activity",
  OTHER: "activity",
};

function parseUTCDate(dateStr: string): Date {
  const key = dateStr.slice(0, 10);
  return new Date(key + "T12:00:00Z");
}

function toLocalDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function dowLabel(dateKey: string): string {
  return parseUTCDate(dateKey).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

function dnumLabel(dateKey: string): string {
  return String(parseUTCDate(dateKey).getUTCDate());
}

function formatMonthDay(dateKey: string): string {
  return parseUTCDate(dateKey).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${suffix}`;
}

function formatDurationShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function transitDurationLabel(event: EventEntry): string {
  if (event.durationMinutes) return formatDurationShort(event.durationMinutes);
  if (event.startTime && event.endTime) {
    const [sh, sm] = event.startTime.split(":").map(Number);
    const [eh, em] = event.endTime.split(":").map(Number);
    let diff = eh * 60 + em - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return formatDurationShort(diff);
  }
  return "";
}

// Relative countdown chip ("In 2 weeks") for the pinned stay hero. Returns null
// for past/ongoing dates rather than showing a negative or zero count.
function relativeChip(dateKey: string): string | null {
  const todayKey = toLocalDateKey(new Date());
  if (dateKey <= todayKey) return null;
  const diffDays = Math.round((parseUTCDate(dateKey).getTime() - parseUTCDate(todayKey).getTime()) / 86400000);
  if (diffDays <= 0) return null;
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 14) return `In ${diffDays} days`;
  if (diffDays < 60) return `In ${Math.round(diffDays / 7)} weeks`;
  return `In ${Math.round(diffDays / 30)} months`;
}

function stayWhenLabel(stay: EventEntry): string {
  const startKey = stay.startDate ? toLocalDateKey(parseUTCDate(stay.startDate)) : null;
  const endKey = stay.endDate ? toLocalDateKey(parseUTCDate(stay.endDate)) : null;
  let range = "";
  if (startKey && endKey && startKey !== endKey) {
    const startD = parseUTCDate(startKey);
    const endD = parseUTCDate(endKey);
    const sameMonth = startD.getUTCMonth() === endD.getUTCMonth() && startD.getUTCFullYear() === endD.getUTCFullYear();
    range = sameMonth ? `${formatMonthDay(startKey)} – ${endD.getUTCDate()}` : `${formatMonthDay(startKey)} – ${formatMonthDay(endKey)}`;
  } else if (startKey) {
    range = formatMonthDay(startKey);
  }
  return [range, stay.provider].filter(Boolean).join(" · ");
}

function stayAddress(stay: EventEntry): string | null {
  const parts = [stay.startLocation, stay.city, stay.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function openDirections(stay: EventEntry) {
  const query = stay.lat != null && stay.lng != null ? `${stay.lat},${stay.lng}` : stayAddress(stay) ?? stay.title;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

// ── Data shapes ─────────────────────────────────────────────────────────────

type EventEntry = Event & { stayRole?: "checkin" | "checkout" };
type CityPlaceholderEntry = TripCity & { stayRole?: "checkin" | "checkout" };
type DayItem =
  | { kind: "event"; event: EventEntry; accent: ItineraryAccent }
  | { kind: "placeholder"; city: CityPlaceholderEntry };

type CityGroup = {
  cityName: string;
  events: Event[];
  placeholders: TripCity[];
  earliestKey: string;
};

type CitySectionData = {
  cityName: string;
  stay: EventEntry | null;
  days: { dateKey: string; dow: string; dnum: string; items: DayItem[] }[];
};

function placeholderCityName(name: string): string {
  const [city] = name.split(",");
  return (city ?? name).trim();
}

// Reservations (now Events) whose checkin/checkout dates fall inside the
// current city's span are synthesized into two calendar entries -- this is
// the existing, working date logic from before the redesign, unchanged.
function buildItinerary(events: Event[]): Map<string, EventEntry[]> {
  const map = new Map<string, EventEntry[]>();
  for (const e of events) {
    if (!e.startDate) continue;
    const isStay = e.type === "HOTEL" || e.type === "AIRBNB";
    const d = parseUTCDate(e.startDate);
    const key = toLocalDateKey(d);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({ ...e, stayRole: isStay ? "checkin" : undefined });

    if (isStay && e.endDate) {
      const endKey = toLocalDateKey(parseUTCDate(e.endDate));
      if (!map.has(endKey)) map.set(endKey, []);
      map.get(endKey)!.push({ ...e, stayRole: "checkout" });
    }
  }
  return map;
}

function placeholdersForDay(placeholders: TripCity[], dateKey: string): CityPlaceholderEntry[] {
  const checkins = placeholders
    .filter((c) => c.targetStartDate!.slice(0, 10) === dateKey)
    .map((c): CityPlaceholderEntry => ({ ...c, stayRole: "checkin" }));
  const checkouts = placeholders
    .filter(
      (c) =>
        c.targetEndDate &&
        c.targetEndDate.slice(0, 10) === dateKey &&
        c.targetEndDate.slice(0, 10) !== c.targetStartDate?.slice(0, 10)
    )
    .map((c): CityPlaceholderEntry => ({ ...c, stayRole: "checkout" }));
  return [...checkouts, ...checkins];
}

function groupByCity(events: Event[], cities: TripCity[]) {
  const groups = new Map<string, CityGroup>();
  const undatedEvents: Event[] = [];
  const undatedCities: TripCity[] = [];
  const citylessDated: Event[] = [];

  function ensure(cityName: string, dateKey: string): CityGroup {
    const key = cityName.toLowerCase();
    let g = groups.get(key);
    if (!g) {
      g = { cityName, events: [], placeholders: [], earliestKey: dateKey };
      groups.set(key, g);
    } else if (dateKey < g.earliestKey) {
      g.earliestKey = dateKey;
    }
    return g;
  }

  function hasEventOnDay(g: CityGroup, dateKey: string): boolean {
    return g.events.some((ev) => ev.startDate && toLocalDateKey(parseUTCDate(ev.startDate)) === dateKey);
  }

  function findGroupCoveringDay(dateKey: string, includePlaceholders: boolean): CityGroup | null {
    for (const g of groups.values()) {
      const coversDay =
        hasEventOnDay(g, dateKey) ||
        (includePlaceholders && g.placeholders.some((c) => c.targetStartDate?.slice(0, 10) === dateKey || c.targetEndDate?.slice(0, 10) === dateKey));
      if (coversDay) return g;
    }
    return null;
  }

  // Pass 1: events with an explicit `city` are the authoritative groups.
  for (const e of events) {
    if (!e.startDate) {
      undatedEvents.push(e);
      continue;
    }
    const cityName = e.city?.trim();
    const dateKey = toLocalDateKey(parseUTCDate(e.startDate));
    if (cityName) {
      ensure(cityName, dateKey).events.push(e);
    } else {
      citylessDated.push(e);
    }
  }

  // Pass 2: TripCity placeholders. This model doubles as both "a whole city
  // stop" and "an individual attraction reminder" (e.g. "Great Market Hall"
  // on the same day as a Budapest stay) -- merge into a group only when a
  // real EVENT (not another placeholder) covers that day. Matching against
  // other placeholders would wrongly chain sequential city legs together,
  // since one city's checkout date is routinely the next city's checkin date.
  for (const c of cities) {
    if (!c.targetStartDate) {
      undatedCities.push(c);
      continue;
    }
    const dateKey = c.targetStartDate.slice(0, 10);
    const existing = findGroupCoveringDay(dateKey, false);
    if (existing) {
      existing.placeholders.push(c);
    } else {
      ensure(placeholderCityName(c.name), dateKey).placeholders.push(c);
    }
  }

  // Pass 3: city-less dated events (flights/activities never get a `city`
  // filled in manually since it's redundant with From/To or Location) --
  // same same-day merge (events are lower risk of the chaining issue above,
  // so placeholders count here too), falling back to a standalone
  // "Unplanned" bucket only when no group covers that date at all.
  for (const e of citylessDated) {
    const dateKey = toLocalDateKey(parseUTCDate(e.startDate!));
    const target = findGroupCoveringDay(dateKey, true);
    (target ?? ensure("Unplanned", dateKey)).events.push(e);
  }

  const sections = Array.from(groups.values()).sort((a, b) => a.earliestKey.localeCompare(b.earliestKey));
  return { sections, undatedEvents, undatedCities };
}

// Picks the pinned hero: the city's earliest lodging event that has a photo.
// Reuses the existing checkin/checkout synthesis so the same stay still also
// appears as separate compact rows in the day timeline (spec wants both).
function buildCitySection(group: CityGroup): CitySectionData {
  const dayMap = buildItinerary(group.events);

  const allDateKeys = new Set<string>(dayMap.keys());
  for (const c of group.placeholders) {
    allDateKeys.add(c.targetStartDate!.slice(0, 10));
    if (c.targetEndDate) allDateKeys.add(c.targetEndDate.slice(0, 10));
  }
  const dateKeys = Array.from(allDateKeys).sort();

  const stayCandidates = group.events
    .filter((e) => (e.type === "HOTEL" || e.type === "AIRBNB") && e.photoUrl && e.startDate)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
  const stay: EventEntry | null = stayCandidates[0] ? { ...stayCandidates[0] } : null;

  const days = dateKeys.map((dateKey) => {
    const eventsToday = dayMap.get(dateKey) ?? [];
    const placeholdersToday = placeholdersForDay(group.placeholders, dateKey);

    const items: DayItem[] = [
      ...placeholdersToday.map((city): DayItem => ({ kind: "placeholder", city })),
      ...eventsToday.map((event): DayItem => ({ kind: "event", event, accent: TYPE_TO_ACCENT[event.type] ?? "activity" })),
    ];
    items.sort((a, b) => {
      const aOut = (a.kind === "event" ? a.event.stayRole : a.city.stayRole) === "checkout" ? 0 : 1;
      const bOut = (b.kind === "event" ? b.event.stayRole : b.city.stayRole) === "checkout" ? 0 : 1;
      return aOut - bOut;
    });

    return { dateKey, dow: dowLabel(dateKey), dnum: dnumLabel(dateKey), items };
  });

  return { cityName: group.cityName, stay, days };
}

// ── Leaf presentation components ─────────────────────────────────────────────

function RowCard({
  accent,
  icon,
  title,
  sub,
  muted,
  routeStrip,
  onClick,
  participants,
  friendMap,
}: {
  accent: ItineraryAccent;
  icon: string;
  title: string;
  sub?: string;
  muted?: boolean;
  routeStrip?: React.ReactNode;
  onClick?: () => void;
  participants?: Array<{ friendId: string; inSplit: boolean }>;
  friendMap?: Record<string, Friend>;
}) {
  return (
    <div className={`bg-surface border rounded-[16px] overflow-hidden ${muted ? "border-dashed border-ink-faint" : "border-ink-faint"}`}>
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
        className={`flex items-center gap-[15px] px-[17px] py-[15px] ${onClick ? "cursor-pointer hover:bg-ink/[0.03] transition-colors" : ""}`}
      >
        <IconTile accent={accent} icon={icon} muted={muted} />
        <div className="flex-1 min-w-0">
          <div className="font-sans text-[16.5px] font-bold tracking-tight text-ink truncate">{title}</div>
          {sub && <div className="font-sans text-[13.5px] text-ink-muted mt-0.5 truncate">{sub}</div>}
          {participants && friendMap && participants.length > 0 && (
            <div className="flex -space-x-2 mt-2">
              {participants.map((p) => {
                const friend = friendMap[p.friendId];
                return (
                  <div
                    key={p.friendId}
                    className="w-6 h-6 rounded-full border border-surface bg-ink-faint flex items-center justify-center flex-shrink-0 overflow-hidden"
                    title={friend?.name ?? "Unknown"}
                  >
                    {friend?.avatarUrl ? (
                      <img
                        src={friend.avatarUrl}
                        alt={friend.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-medium text-ink">
                        {friend?.name?.charAt(0).toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {routeStrip}
    </div>
  );
}

function PhotoHero({
  kind,
  photoUrl,
  title,
  when,
  chip,
  address,
  onDirections,
  onViewClick,
}: {
  kind: "stay" | "experience";
  photoUrl: string;
  title: string;
  when: string;
  chip?: string;
  address?: string | null;
  onDirections?: () => void;
  onViewClick?: () => void;
}) {
  const isStay = kind === "stay";
  return (
    <div className="bg-surface border border-ink-faint rounded-[20px] overflow-hidden">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt={title} className={`w-full object-cover block ${isStay ? "h-[210px]" : "h-[190px]"}`} />
        {chip && (
          <span className="font-sans absolute top-3.5 left-3.5 bg-surface text-ink text-[13px] font-semibold px-[13px] py-[7px] rounded-[20px] border border-ink-faint">
            {chip}
          </span>
        )}
      </div>
      <div className={isStay ? "px-5 pt-[18px] pb-5" : "px-[18px] pt-4 pb-[18px]"}>
        <h2
          className={
            isStay
              ? "font-display text-[25px] font-bold tracking-tight text-ink"
              : "font-display text-xl font-bold tracking-tight text-ink leading-[1.22]"
          }
        >
          {title}
        </h2>
        <div className="font-sans text-[15px] text-ink-muted mt-[5px]">{when}</div>
        {isStay ? (
          <>
            <hr className="border-t border-ink-faint my-4" />
            <div className="flex items-center justify-between gap-3.5">
              {address && <div className="font-sans text-sm text-ink-muted leading-snug flex-1 min-w-0">{address}</div>}
              {onDirections && (
                <button
                  onClick={onDirections}
                  className="font-sans flex-shrink-0 whitespace-nowrap border border-ink-faint bg-surface text-ink text-[15px] font-semibold px-5 py-3 rounded-[12px] hover:border-moss hover:text-moss transition-colors"
                >
                  Get directions
                </button>
              )}
            </div>
          </>
        ) : (
          onViewClick && (
            <button
              onClick={onViewClick}
              className="font-sans w-full mt-[15px] border border-ink-faint bg-surface text-ink text-[15px] font-bold py-[13px] rounded-[12px] hover:border-moss hover:text-moss transition-colors"
            >
              View experience
            </button>
          )
        )}
      </div>
    </div>
  );
}

function TimelineBlock({
  dow,
  dnum,
  isContinuation,
  accent,
  muted,
  children,
}: {
  dow: string;
  dnum: string;
  isContinuation: boolean;
  accent: ItineraryAccent | null;
  muted?: boolean;
  children: React.ReactNode;
}) {
  const tickColor = muted || !accent
    ? "bg-ink-faint"
    : accent === "lodging"
    ? "bg-lodging"
    : accent === "transit"
    ? "bg-transit"
    : accent === "food"
    ? "bg-food"
    : "bg-gold";

  return (
    <div className="grid items-start" style={{ gridTemplateColumns: "52px 1fr", columnGap: "14px" }}>
      <div className="relative flex flex-col items-center self-stretch">
        <div className="absolute inset-y-0 w-px bg-ink-faint" />
        {!isContinuation ? (
          <div className="relative z-10 mt-0.5 text-center">
            <div className="font-sans text-[13px] font-medium text-ink-muted leading-none">{dow}</div>
            <div className="font-sans w-[38px] h-[38px] mt-1 rounded-full bg-surface border border-ink-faint flex items-center justify-center text-[17px] font-bold text-ink">
              {dnum}
            </div>
          </div>
        ) : (
          <div className="invisible h-0" />
        )}
        <div
          className={`relative z-10 w-2.5 h-2.5 rounded-full shadow-[0_0_0_4px_var(--color-bg)] ${tickColor} ${isContinuation ? "mt-6" : "mt-2.5"}`}
        />
      </div>
      <div className="min-w-0 pb-5">{children}</div>
    </div>
  );
}

function EventCard({
  event,
  accent,
  isPinnedStay,
  onEdit,
  friendMap,
}: {
  event: EventEntry;
  accent: ItineraryAccent;
  isPinnedStay: boolean;
  onEdit: () => void;
  friendMap: Record<string, Friend>;
}) {
  const variant: "hero" | "row" = !isPinnedStay && !!event.photoUrl && accent !== "transit" ? "hero" : "row";

  if (variant === "hero") {
    return (
      <PhotoHero
        kind="experience"
        photoUrl={event.photoUrl!}
        title={event.title}
        when={[event.startTime, event.provider].filter(Boolean).join(" · ")}
        onViewClick={onEdit}
      />
    );
  }

  const isCheckin = event.stayRole === "checkin";
  const isCheckout = event.stayRole === "checkout";
  const icon = isCheckin || isCheckout ? "🚪" : EVENT_ICONS[event.type] ?? "📋";

  let title: string;
  let sub: string;
  if (isCheckin || isCheckout) {
    title = isCheckin
      ? event.startTime
        ? `Check in after ${formatTime12h(event.startTime)}`
        : "Check in"
      : event.endTime
      ? `Check out before ${formatTime12h(event.endTime)}`
      : "Check out";
    sub = [event.title, event.provider].filter(Boolean).join(" · ");
  } else if (accent === "transit") {
    title = event.title;
    sub = [[event.startLocation, event.endLocation].filter(Boolean).join(" → "), transitDurationLabel(event) || null]
      .filter(Boolean)
      .join(" · ");
  } else {
    title = event.title;
    sub = [event.startTime, event.provider].filter(Boolean).join(" · ");
  }

  const from = event.startLocation && event.startTime ? { place: event.startLocation, time: event.startTime } : null;
  const to = event.endLocation && event.endTime ? { place: event.endLocation, time: event.endTime } : null;
  const routeStrip =
    accent === "transit" && from && to ? <RouteStrip from={from} to={to} duration={transitDurationLabel(event)} /> : undefined;

  return <RowCard accent={accent} icon={icon} title={title} sub={sub} onClick={onEdit} routeStrip={routeStrip} participants={event.participants} friendMap={friendMap} />;
}

// ── Planned-stop (TripCity) inline form + row ────────────────────────────────

const inputCls = "w-full border border-ink-faint bg-white px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:border-moss focus:outline-none";

function CityForm({
  tripId,
  initial,
  onSave,
  onCancel,
}: {
  tripId: string;
  initial?: TripCity;
  onSave: (city: TripCity) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [start, setStart] = useState(initial?.targetStartDate?.slice(0, 10) ?? "");
  const [end, setEnd] = useState(initial?.targetEndDate?.slice(0, 10) ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const payload = { name: name.trim(), targetStartDate: start || null, targetEndDate: end || null, notes: notes.trim() || null };
    const res = initial
      ? await fetch(`/api/trips/${tripId}/cities/${initial.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch(`/api/trips/${tripId}/cities`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      onSave(await res.json());
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="border border-gold/40 bg-gold-tint/30 p-4 space-y-3 rounded-[16px]">
      <p className="text-xs font-medium text-gold uppercase tracking-wide">{initial ? "Edit stop" : "Add a planned stop"}</p>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="City or destination" className={inputCls} autoFocus required />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink-muted mb-1">Target start</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-1">Target end</label>
          <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
        </div>
      </div>
      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className={inputCls} />
      <div className="flex gap-2">
        <button type="submit" disabled={saving || !name.trim()} className="bg-moss text-white text-xs px-4 py-2 rounded-[12px] hover:bg-moss-dark disabled:opacity-50">
          {saving ? "Saving…" : initial ? "Save" : "Add stop"}
        </button>
        <button type="button" onClick={onCancel} className="text-xs px-4 py-2 border border-ink-faint text-ink-muted rounded-[12px] hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

function CityPlaceholderRow({
  city,
  tripId,
  onEdit,
  onDelete,
  stayRole,
}: {
  city: TripCity;
  tripId: string;
  onEdit: () => void;
  onDelete: () => void;
  stayRole?: "checkin" | "checkout";
}) {
  async function handleDelete() {
    if (!confirm(`Remove "${city.name}" from your planned stops?`)) return;
    const res = await fetch(`/api/trips/${tripId}/cities/${city.id}`, { method: "DELETE" });
    if (res.ok) onDelete();
  }

  const isCheckout = stayRole === "checkout";
  const icon = isCheckout ? "🔓" : "📍";
  const sub = stayRole ? (isCheckout ? "planned checkout" : "planned check-in") : "planned stop";

  return (
    <div className="bg-surface border border-dashed border-ink-faint rounded-[16px] overflow-hidden">
      <div className="flex items-center gap-[15px] px-[17px] py-[15px]">
        <IconTile accent="activity" icon={icon} muted />
        <div className="flex-1 min-w-0">
          <div className="font-sans text-[16.5px] font-bold tracking-tight text-ink truncate">{city.name}</div>
          <div className="font-sans text-[13.5px] text-ink-muted mt-0.5 truncate">
            {sub}
            {city.notes ? ` · ${city.notes}` : ""}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEdit} className="font-sans text-xs text-ink-muted hover:text-ink px-1.5 py-1">Edit</button>
          <button onClick={handleDelete} className="font-sans text-xs text-ink-muted hover:text-red-600 px-1.5 py-1">✕</button>
        </div>
      </div>
    </div>
  );
}

// ── City section ──────────────────────────────────────────────────────────

function CitySectionView({
  section,
  tripId,
  cities,
  editingCityId,
  setEditingCityId,
  updateCities,
  onEditEvent,
  onAddEvent,
  nextCityName,
  friendMap,
}: {
  section: CitySectionData;
  tripId: string;
  cities: TripCity[];
  editingCityId: string | null;
  setEditingCityId: (id: string | null) => void;
  updateCities: (cities: TripCity[]) => void;
  onEditEvent: (event: Event) => void;
  onAddEvent: (cityName: string) => void;
  nextCityName: string | null;
  friendMap: Record<string, Friend>;
}) {
  return (
    <div>
      <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink mb-4">{section.cityName}</h1>

      {section.stay && (
        <div className="mb-4">
          <PhotoHero
            kind="stay"
            photoUrl={section.stay.photoUrl!}
            title={section.stay.title}
            when={stayWhenLabel(section.stay)}
            chip={section.stay.startDate ? relativeChip(toLocalDateKey(parseUTCDate(section.stay.startDate))) ?? undefined : undefined}
            address={stayAddress(section.stay)}
            onDirections={() => openDirections(section.stay!)}
          />
        </div>
      )}

      <div>
        {section.days.map((day) =>
          day.items.map((item, i) => (
            <TimelineBlock
              key={item.kind === "event" ? `${item.event.id}-${item.event.stayRole ?? ""}` : `${item.city.id}-${item.city.stayRole ?? ""}`}
              dow={day.dow}
              dnum={day.dnum}
              isContinuation={i > 0}
              accent={item.kind === "event" ? item.accent : null}
              muted={item.kind === "placeholder"}
            >
              {item.kind === "placeholder" ? (
                editingCityId === item.city.id ? (
                  <CityForm
                    tripId={tripId}
                    initial={item.city}
                    onSave={(updated) => {
                      updateCities(cities.map((c) => (c.id === updated.id ? updated : c)));
                      setEditingCityId(null);
                    }}
                    onCancel={() => setEditingCityId(null)}
                  />
                ) : (
                  <CityPlaceholderRow
                    city={item.city}
                    tripId={tripId}
                    stayRole={item.city.stayRole}
                    onEdit={() => setEditingCityId(item.city.id)}
                    onDelete={() => updateCities(cities.filter((c) => c.id !== item.city.id))}
                  />
                )
              ) : (
                <EventCard
                  event={item.event}
                  accent={item.accent}
                  isPinnedStay={!!section.stay && item.event.id === section.stay.id}
                  onEdit={() => onEditEvent(item.event)}
                  friendMap={friendMap}
                />
              )}
            </TimelineBlock>
          ))
        )}
      </div>

      <button
        onClick={() => onAddEvent(section.cityName)}
        className="font-sans w-full mt-1.5 border-[1.5px] border-dashed border-ink-faint text-ink-muted text-[14.5px] font-semibold py-3.5 rounded-[14px] hover:border-moss hover:text-moss transition-colors"
      >
        ＋ Add event
      </button>

      {nextCityName && <div className="mt-8 font-display text-[22px] font-extrabold text-ink-muted">{nextCityName} →</div>}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────

export default function ItineraryView({
  tripId,
  events,
  cities: initialCities,
  friendMap,
  onCitiesUpdate,
  onEventSaved,
}: {
  tripId: string;
  events: Event[];
  cities: TripCity[];
  friendMap: Record<string, Friend>;
  onCitiesUpdate: (cities: TripCity[]) => void;
  onEventSaved: (event: Event) => void;
}) {
  const [cities, setCities] = useState<TripCity[]>(initialCities);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [eventPrefill, setEventPrefill] = useState<Partial<EventFormShape> | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  function updateCities(updated: TripCity[]) {
    setCities(updated);
    onCitiesUpdate(updated);
  }

  const { sections: cityGroups, undatedEvents, undatedCities } = groupByCity(events, cities);
  const citySections = cityGroups.map(buildCitySection);

  const allEmpty = citySections.length === 0 && undatedEvents.length === 0 && undatedCities.length === 0;

  return (
    <div className="space-y-10">
      {allEmpty && (
        <div className="border border-ink-faint border-dashed p-12 text-center rounded-[16px]">
          <p className="text-4xl mb-3">🗺</p>
          <p className="font-display text-xl text-ink-muted mb-1">Nothing scheduled yet</p>
          <p className="font-sans text-sm text-ink-muted">Add a planned stop or event to build your itinerary.</p>
        </div>
      )}

      {citySections.map((section, i) => (
        <CitySectionView
          key={section.cityName}
          section={section}
          tripId={tripId}
          cities={cities}
          editingCityId={editingCityId}
          setEditingCityId={setEditingCityId}
          updateCities={updateCities}
          onEditEvent={(event) => setEditingEvent(event)}
          onAddEvent={(cityName) => setEventPrefill({ type: "ACTIVITY", city: cityName })}
          nextCityName={i < citySections.length - 1 ? citySections[i + 1].cityName : null}
          friendMap={friendMap}
        />
      ))}

      {undatedEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-mono bg-ink-muted text-white px-2 py-1 leading-none">TBD</span>
            <span className="font-display text-lg text-ink-muted">Date not set</span>
            <div className="flex-1 h-px bg-ink-faint" />
          </div>
          <div className="space-y-3">
            {undatedEvents.map((e) => (
              <EventCard key={e.id} event={e} accent={TYPE_TO_ACCENT[e.type] ?? "activity"} isPinnedStay={false} onEdit={() => setEditingEvent(e)} friendMap={friendMap} />
            ))}
          </div>
        </div>
      )}

      {undatedCities.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-mono bg-gold text-white px-2 py-1 leading-none">TBD</span>
            <span className="font-display text-lg text-ink-muted">Dates not set</span>
            <div className="flex-1 h-px bg-ink-faint" />
          </div>
          <div className="space-y-3">
            {undatedCities.map((c) =>
              editingCityId === c.id ? (
                <CityForm
                  key={c.id}
                  tripId={tripId}
                  initial={c}
                  onSave={(updated) => {
                    updateCities(cities.map((x) => (x.id === updated.id ? updated : x)));
                    setEditingCityId(null);
                  }}
                  onCancel={() => setEditingCityId(null)}
                />
              ) : (
                <CityPlaceholderRow key={c.id} city={c} tripId={tripId} onEdit={() => setEditingCityId(c.id)} onDelete={() => updateCities(cities.filter((x) => x.id !== c.id))} />
              )
            )}
          </div>
        </div>
      )}

      {(eventPrefill || editingEvent) && (
        <EventFormModal
          tripId={tripId}
          friendMap={friendMap}
          prefill={eventPrefill ?? undefined}
          editingEvent={editingEvent}
          onSaved={(saved) => {
            onEventSaved(saved);
            setEventPrefill(null);
            setEditingEvent(null);
          }}
          onClose={() => {
            setEventPrefill(null);
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}
