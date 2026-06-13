"use client";

import { useState, useCallback, useEffect } from "react";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Friend } from "@/lib/friends";
import { AvatarStack } from "@/components/AvatarStack";
import { BOOKING_COLORS } from "@/components/ReservationsList";
import type { TripCity } from "@/components/TripDetailClient";

type Participant = { friendId: string };
type Attachment = { id: string; filename: string; originalName: string };

type Reservation = {
  id: string;
  type: string;
  title: string;
  startDate: string | null;
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
  startLocation: string | null;
  endLocation: string | null;
  city: string | null;
  state: string | null;
  durationMinutes: number | null;
  partySize: number | null;
  provider: string | null;
  confirmationCode: string | null;
  price: string | null;
  currency: string;
  notes: string | null;
  color: string | null;
  participants: Participant[];
  attachments: Attachment[];
};

const ICONS: Record<string, string> = {
  FLIGHT: "✈", HOTEL: "🏨", AIRBNB: "🏠", TRAIN: "🚂", BUS: "🚌", RENTAL_CAR: "🚗",
  FOOD_TOUR: "🍜", CITY_TOUR: "🗺", MUSEUM: "🏛", RESTAURANT: "🍽", ACTIVITY: "🎯", OTHER: "📋",
};

// Opacity-based hue tints so each type's color reads on both the light surface
// and the dark moss-charcoal ground without needing separate dark: variants.
const COLORS: Record<string, string> = {
  FLIGHT: "bg-blue-500/10 border-blue-500/30",
  HOTEL: "bg-purple-500/10 border-purple-500/30",
  AIRBNB: "bg-pink-500/10 border-pink-500/30",
  TRAIN: "bg-moss-tint/60 border-moss/30",
  BUS: "bg-panel border-ink-faint",
  RENTAL_CAR: "bg-gold-tint/60 border-gold/30",
  FOOD_TOUR: "bg-orange-500/10 border-orange-500/30",
  CITY_TOUR: "bg-cyan-500/10 border-cyan-500/30",
  MUSEUM: "bg-indigo-500/10 border-indigo-500/30",
  RESTAURANT: "bg-rose-500/10 border-rose-500/30",
  ACTIVITY: "bg-yellow-500/10 border-yellow-500/30",
  OTHER: "bg-panel border-ink-faint",
};

const NODE_COLORS: Record<string, string> = {
  FLIGHT: "bg-blue-400",
  HOTEL: "bg-purple-400",
  AIRBNB: "bg-pink-400",
  TRAIN: "bg-moss",
  BUS: "bg-ink-muted",
  RENTAL_CAR: "bg-gold",
  FOOD_TOUR: "bg-orange-400",
  CITY_TOUR: "bg-cyan-400",
  MUSEUM: "bg-indigo-400",
  RESTAURANT: "bg-rose-400",
  ACTIVITY: "bg-yellow-500",
  OTHER: "bg-ink-faint",
};

function parseUTCDate(dateStr: string): Date {
  const key = dateStr.slice(0, 10);
  return new Date(key + "T12:00:00Z");
}

function toLocalDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

type ItineraryEntry = Reservation & { stayRole?: "checkin" | "checkout" };
type CityEntry = TripCity & { stayRole: "checkin" | "checkout" };

function locationLabel(r: { city: string | null; state: string | null }): string {
  return [r.city, r.state].filter(Boolean).join(", ");
}

function dayLocationLabel(items: ItineraryEntry[]): string {
  const checkout = items.find((r) => r.stayRole === "checkout");
  const checkin = items.find((r) => r.stayRole === "checkin");

  if (checkout && checkin) {
    const from = locationLabel(checkout);
    const to = locationLabel(checkin);
    if (from && to && from !== to) return `${from} → ${to}`;
    if (to) return to;
    if (from) return from;
  }

  for (const item of items) {
    const loc = locationLabel(item);
    if (loc) return loc;
  }

  return "—";
}

function buildItinerary(reservations: Reservation[]): Map<string, ItineraryEntry[]> {
  const map = new Map<string, ItineraryEntry[]>();
  for (const r of reservations) {
    if (!r.startDate) continue;
    const isStay = r.type === "HOTEL" || r.type === "AIRBNB";
    const d = parseUTCDate(r.startDate);
    const key = toLocalDateKey(d);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({ ...r, stayRole: isStay ? "checkin" : undefined });

    if (isStay && r.endDate) {
      const endD = parseUTCDate(r.endDate);
      const endKey = toLocalDateKey(endD);
      if (!map.has(endKey)) map.set(endKey, []);
      map.get(endKey)!.push({ ...r, stayRole: "checkout" });
    }
  }
  return map;
}

// ── Inline city form ──────────────────────────────────────────────────────────

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
    <form onSubmit={submit} className="border border-gold/40 bg-gold-tint/30 p-4 space-y-3">
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
        <button type="submit" disabled={saving || !name.trim()} className="bg-moss text-white text-xs px-4 py-2 hover:bg-moss-dark disabled:opacity-50">
          {saving ? "Saving…" : initial ? "Save" : "Add stop"}
        </button>
        <button type="button" onClick={onCancel} className="text-xs px-4 py-2 border border-ink-faint text-ink-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── CityPlaceholder card ───────────────────────────────────────────────────────

function CityPlaceholder({
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

  function toDateKey(s: string) { return s.slice(0, 10); }
  function parseDateKey(s: string) { return new Date(toDateKey(s) + "T12:00:00Z"); }

  let nights: number | null = null;
  if (city.targetStartDate && city.targetEndDate) {
    nights = Math.round((parseDateKey(city.targetEndDate).getTime() - parseDateKey(city.targetStartDate).getTime()) / 86400000);
  }

  const isCheckout = stayRole === "checkout";
  const icon = isCheckout ? "🔓" : "📍";
  const nodeColor = isCheckout ? "bg-gold/50" : "bg-gold";

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 flex flex-col items-center pt-3.5">
        <div className={`w-2.5 h-2.5 rounded-full z-10 ${nodeColor}`} />
      </div>
      <div className="flex-1 border border-gold/40 border-dashed bg-gold-tint/20 px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none mt-0.5 flex-shrink-0">{icon}</span>
            <span className="font-medium text-ink text-sm">{city.name}</span>
          </div>
          {stayRole ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded leading-none ${
                stayRole === "checkin" ? "bg-gold/15 text-gold" : "bg-ink-muted/10 text-ink-muted"
              }`}>
                {stayRole === "checkin" ? "CHECK-IN" : "CHECK-OUT"}
              </span>
              {stayRole === "checkin" && nights !== null && nights > 0 && (
                <span className="text-xs text-ink-muted font-mono">{nights}n</span>
              )}
            </div>
          ) : (
            <p className="text-xs text-ink-muted font-mono mt-0.5">planned stop</p>
          )}
          {city.notes && <p className="text-xs text-ink-muted italic mt-1">{city.notes}</p>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEdit} className="text-xs text-ink-muted hover:text-ink px-1.5 py-1">Edit</button>
          <button onClick={handleDelete} className="text-xs text-ink-muted hover:text-red-600 px-1.5 py-1">✕</button>
        </div>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function ItineraryView({
  tripId,
  reservations,
  cities: initialCities,
  friendMap,
  onCitiesUpdate,
  addTrigger = 0,
}: {
  tripId: string;
  reservations: Reservation[];
  cities: TripCity[];
  friendMap: Record<string, Friend>;
  onCitiesUpdate: (cities: TripCity[]) => void;
  addTrigger?: number;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cities, setCities] = useState<TripCity[]>(initialCities);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);

  useEffect(() => {
    if (addTrigger > 0) {
      setShowAddForm(true);
      setTimeout(() => document.querySelector<HTMLInputElement>('input[placeholder="City or destination"]')?.focus(), 50);
    }
  }, [addTrigger]);

  function updateCities(updated: TripCity[]) {
    setCities(updated);
    onCitiesUpdate(updated);
  }

  const itinerary = buildItinerary(reservations);
  const undated = reservations.filter((r) => !r.startDate);

  const datedCities = cities.filter((c) => !!c.targetStartDate);
  const undatedCities = cities.filter((c) => !c.targetStartDate);

  function citiesForDay(dateKey: string): CityEntry[] {
    const checkins = datedCities
      .filter((c) => c.targetStartDate!.slice(0, 10) === dateKey)
      .map((c): CityEntry => ({ ...c, stayRole: "checkin" }));
    const checkouts = datedCities
      .filter((c) =>
        c.targetEndDate &&
        c.targetEndDate.slice(0, 10) === dateKey &&
        c.targetEndDate.slice(0, 10) !== c.targetStartDate?.slice(0, 10)
      )
      .map((c): CityEntry => ({ ...c, stayRole: "checkout" }));
    return [...checkouts, ...checkins];
  }

  const allEmpty = itinerary.size === 0 && undated.length === 0 && cities.length === 0;

  // Build sorted list of all day keys (reservations + all dated cities, including checkout days)
  const allDateKeys = new Set([
    ...Array.from(itinerary.keys()),
    ...datedCities.map((c) => c.targetStartDate!.slice(0, 10)),
    ...datedCities.filter((c) => c.targetEndDate).map((c) => c.targetEndDate!.slice(0, 10)),
  ]);
  const days = Array.from(allDateKeys).sort();
  const firstDate = days.length > 0 ? new Date(days[0] + "T12:00:00Z") : null;

  function dayNum(dateKey: string): number {
    if (!firstDate) return 1;
    const d = new Date(dateKey + "T12:00:00Z");
    return Math.round((d.getTime() - firstDate.getTime()) / 86400000) + 1;
  }

  return (
    <div className="space-y-10">
      {allEmpty && (
        <div className="border border-ink-faint border-dashed p-12 text-center">
          <p className="text-4xl mb-3">🗺</p>
          <p className="font-display italic text-xl text-ink-muted mb-1">Nothing scheduled yet</p>
          <p className="text-sm text-ink-muted">Add a planned stop or reservation to build your itinerary.</p>
        </div>
      )}

      {days.map((dateKey) => {
        const reservations = itinerary.get(dateKey) ?? [];
        const citiesHere = citiesForDay(dateKey);
        const date = new Date(dateKey + "T12:00:00Z");
        const num = dayNum(dateKey);

        type DayEntry =
          | { kind: "reservation"; entry: ItineraryEntry }
          | { kind: "city"; entry: CityEntry };

        const dayEntries: DayEntry[] = [
          ...citiesHere.map((c): DayEntry => ({ kind: "city", entry: c })),
          ...reservations.map((r): DayEntry => ({ kind: "reservation", entry: r })),
        ].sort((a, b) => (a.entry.stayRole === "checkout" ? 0 : 1) - (b.entry.stayRole === "checkout" ? 0 : 1));

        return (
          <div key={dateKey}>
            <div className="mb-5">
              <div className="flex items-baseline gap-3 mb-0.5">
                <span className={`text-xs font-mono px-2 py-1 leading-none flex-shrink-0 ${reservations.length > 0 ? "bg-moss text-white" : "bg-gold text-white"}`}>
                  Day {num}
                </span>
                <h3 className="font-display italic font-bold text-ink leading-none" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
                  {reservations.length > 0 ? dayLocationLabel(reservations) : citiesHere[0]?.name ?? "—"}
                </h3>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-sm font-mono text-ink-muted">
                  {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </span>
                <div className="flex-1 h-px bg-ink-faint" />
              </div>
            </div>

            <div className="relative ml-4">
              {dayEntries.length > 1 && (
                <div className="absolute left-[5px] top-4 bottom-4 w-px bg-ink-faint" />
              )}
              <div className="space-y-3">
                {dayEntries.map((item) =>
                  item.kind === "city" ? (
                    editingCityId === item.entry.id && item.entry.stayRole === "checkin" ? (
                      <CityForm
                        key={`${item.entry.id}-${item.entry.stayRole}`}
                        tripId={tripId}
                        initial={item.entry}
                        onSave={(updated) => {
                          updateCities(cities.map((c) => c.id === updated.id ? updated : c));
                          setEditingCityId(null);
                        }}
                        onCancel={() => setEditingCityId(null)}
                      />
                    ) : (
                      <CityPlaceholder
                        key={`${item.entry.id}-${item.entry.stayRole}`}
                        city={item.entry}
                        tripId={tripId}
                        stayRole={item.entry.stayRole}
                        onEdit={() => setEditingCityId(item.entry.id)}
                        onDelete={() => updateCities(cities.filter((c) => c.id !== item.entry.id))}
                      />
                    )
                  ) : (
                    <ReservationCard
                      key={item.entry.id}
                      reservation={item.entry}
                      expanded={expandedId === item.entry.id}
                      onToggle={() => setExpandedId(prev => prev === item.entry.id ? null : item.entry.id)}
                      friendMap={friendMap}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        );
      })}

      {undated.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-mono bg-ink-muted text-white px-2 py-1 leading-none">TBD</span>
            <span className="font-display italic text-lg text-ink-muted">Date not set</span>
            <div className="flex-1 h-px bg-ink-faint" />
          </div>
          <div className="ml-4 space-y-3">
            {undated.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                expanded={expandedId === r.id}
                onToggle={() => setExpandedId(prev => prev === r.id ? null : r.id)}
                friendMap={friendMap}
              />
            ))}
          </div>
        </div>
      )}

      {undatedCities.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-mono bg-gold text-white px-2 py-1 leading-none">TBD</span>
            <span className="font-display italic text-lg text-ink-muted">Dates not set</span>
            <div className="flex-1 h-px bg-ink-faint" />
          </div>
          <div className="ml-4 space-y-3">
            {undatedCities.map((c) =>
              editingCityId === c.id ? (
                <CityForm
                  key={c.id}
                  tripId={tripId}
                  initial={c}
                  onSave={(updated) => {
                    updateCities(cities.map((x) => x.id === updated.id ? updated : x));
                    setEditingCityId(null);
                  }}
                  onCancel={() => setEditingCityId(null)}
                />
              ) : (
                <CityPlaceholder
                  key={c.id}
                  city={c}
                  tripId={tripId}
                  onEdit={() => setEditingCityId(c.id)}
                  onDelete={() => updateCities(cities.filter((x) => x.id !== c.id))}
                />
              )
            )}
          </div>
        </div>
      )}

      {showAddForm && (
        <CityForm
          tripId={tripId}
          onSave={(newCity) => {
            updateCities([...cities, newCity]);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [text]);

  return (
    <button
      onClick={copy}
      title="Copy address"
      className={`flex-shrink-0 text-xs px-1.5 py-0.5 border transition-colors ${
        copied
          ? "border-moss/40 text-moss bg-moss/8"
          : "border-ink-faint text-ink-muted hover:border-moss/40 hover:text-moss"
      }`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ReservationCard({
  reservation: r,
  expanded,
  onToggle,
  friendMap,
}: {
  reservation: ItineraryEntry;
  expanded: boolean;
  onToggle: () => void;
  friendMap: Record<string, Friend>;
}) {
  const customColor = r.color ? BOOKING_COLORS.find(c => c.id === r.color) : null;
  const nodeColor = customColor ? customColor.swatch : (NODE_COLORS[r.type] ?? "bg-ink-muted");
  const cardStyle = customColor ? customColor.card : (COLORS[r.type] ?? "bg-panel border-ink-faint");
  const isStay = r.type === "HOTEL" || r.type === "AIRBNB";
  const isCheckout = r.stayRole === "checkout";
  const icon = isCheckout ? "🔓" : (ICONS[r.type] ?? "📋");
  const addressParts = isStay ? [r.startLocation, r.city, r.state].filter(Boolean) : [];
  const address = addressParts.length > 0 ? addressParts.join(", ") : null;

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 flex flex-col items-center pt-3.5">
        <div className={`w-2.5 h-2.5 rounded-full z-10 ${nodeColor}`} />
      </div>

      <div className={`flex-1 border ${cardStyle} overflow-hidden transition-all duration-200`}>
        <button
          onClick={onToggle}
          className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-ink/[0.04] transition-colors"
        >
          <span className="text-base leading-none mt-0.5 flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="font-medium text-ink text-sm leading-snug">{r.title}</span>
                {!r.stayRole && (
                  <span className="text-xs text-ink-muted">{r.type.replace(/_/g, " ").toLowerCase()}</span>
                )}
              </div>
              {isStay && r.provider && (
                <span className="text-xs text-ink-muted flex-shrink-0">{r.provider}</span>
              )}
            </div>
            {r.stayRole ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-medium px-2 py-0.5 rounded leading-none font-mono ${
                  r.stayRole === "checkin"
                    ? "bg-moss/10 text-moss"
                    : "bg-gold/15 text-gold"
                }`}>
                  {r.stayRole === "checkin"
                    ? `CHECK-IN${r.startTime ? `  ${r.startTime}` : ""}`
                    : `CHECK-OUT${r.endTime ? `  ${r.endTime}` : ""}`}
                </span>
              </div>
            ) : (
              r.startTime && <p className="text-xs text-ink-muted font-mono mt-0.5">{r.startTime}</p>
            )}
          </div>
          {r.participants.length > 0 && !expanded && (
            <AvatarStack
              friends={r.participants
                .map((p) => friendMap[p.friendId])
                .filter(Boolean) as Friend[]}
            />
          )}
          <span className={`text-ink-faint text-xs flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </button>

        {expanded && (
          <div className="px-4 pb-4 pt-0 border-t border-ink/10">
            {address && (
              <div className="flex items-center gap-2 mt-3 mb-1">
                <span className="text-xs text-ink-muted flex-shrink-0">Address</span>
                <span className="text-xs text-ink flex-1 min-w-0">{address}</span>
                <CopyButton text={address} />
              </div>
            )}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs mt-3">
              {r.confirmationCode && <><dt className="text-ink-muted">Confirmation</dt><dd className="text-ink font-mono font-medium">{r.confirmationCode}</dd></>}
              {r.startDate && <><dt className="text-ink-muted">Date</dt><dd className="text-ink">{r.endDate && r.endDate !== r.startDate ? `${formatDate(r.startDate)} → ${formatDate(r.endDate)}` : formatDate(r.startDate)}</dd></>}
              {r.durationMinutes && <><dt className="text-ink-muted">Duration</dt><dd className="text-ink">{r.durationMinutes} min</dd></>}
              {r.price && <><dt className="text-ink-muted">Price</dt><dd className="text-ink">{formatPrice(r.price, r.currency)}</dd></>}
            </dl>
            {r.notes && <p className="text-xs text-ink-muted italic mt-3 pt-3 border-t border-ink/10">{r.notes}</p>}
            {r.participants.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {r.participants.map((p) => (
                  <span key={p.friendId} className="text-xs bg-surface/80 text-ink-muted px-1.5 py-0.5 border border-ink-faint">
                    {friendMap[p.friendId]?.name ?? "Friend"}
                  </span>
                ))}
              </div>
            )}
            {r.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {r.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={`/api/media/${a.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-moss hover:underline"
                  >
                    📎 {a.originalName}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
