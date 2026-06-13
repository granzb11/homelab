"use client";

import { useState } from "react";
import { formatDate, formatDateRange, formatPrice } from "@/lib/utils";
import { OWNER_ID, personName, type SplitMode, type SplitParticipant } from "@/lib/split";
import SplitEditor from "./SplitEditor";
import type { Friend } from "@/lib/friends";

type Attachment = { id: string; filename: string; originalName: string; mimeType: string };
type Participant = { id: string; friendId: string; inSplit: boolean; splitValue: string | null };

type Reservation = {
  id: string;
  tripId: string;
  type: string;
  title: string;
  confirmationCode: string | null;
  provider: string | null;
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
  price: string | null;
  currency: string;
  notes: string | null;
  color: string | null;
  splitMode: string;
  paidBy: string;
  createdAt: string;
  participants: Participant[];
  attachments: Attachment[];
};

const RESERVATION_TYPES = ["FLIGHT", "HOTEL", "AIRBNB", "TRAIN", "BUS", "RENTAL_CAR", "FOOD_TOUR", "CITY_TOUR", "MUSEUM", "RESTAURANT", "ACTIVITY", "OTHER"] as const;
const RESERVATION_ICONS: Record<string, string> = {
  FLIGHT: "✈", HOTEL: "🏨", AIRBNB: "🏠", TRAIN: "🚂", BUS: "🚌", RENTAL_CAR: "🚗",
  FOOD_TOUR: "🍜", CITY_TOUR: "🗺", MUSEUM: "🏛", RESTAURANT: "🍽", ACTIVITY: "🎯", OTHER: "📋",
};
// Opacity-based hue tints adapt to both the light surface and the dark ground.
export const TYPE_COLORS: Record<string, string> = {
  FLIGHT: "bg-blue-500/10 border-blue-500/25",
  HOTEL: "bg-purple-500/10 border-purple-500/25",
  AIRBNB: "bg-pink-500/10 border-pink-500/25",
  TRAIN: "bg-moss-tint/60 border-moss/30",
  BUS: "bg-panel border-ink-faint",
  RENTAL_CAR: "bg-gold-tint/60 border-gold/30",
  FOOD_TOUR: "bg-orange-500/10 border-orange-500/25",
  CITY_TOUR: "bg-cyan-500/10 border-cyan-500/25",
  MUSEUM: "bg-indigo-500/10 border-indigo-500/25",
  RESTAURANT: "bg-rose-500/10 border-rose-500/25",
  ACTIVITY: "bg-yellow-500/10 border-yellow-500/25",
  OTHER: "bg-panel border-ink-faint",
};

export const BOOKING_COLORS: { id: string; label: string; swatch: string; card: string }[] = [
  { id: "red",    label: "Red",    swatch: "bg-red-400",    card: "bg-red-500/10 border-red-500/30" },
  { id: "orange", label: "Orange", swatch: "bg-orange-400", card: "bg-orange-500/10 border-orange-500/30" },
  { id: "amber",  label: "Amber",  swatch: "bg-amber-400",  card: "bg-amber-500/10 border-amber-500/30" },
  { id: "lime",   label: "Lime",   swatch: "bg-lime-500",   card: "bg-lime-500/10 border-lime-500/30" },
  { id: "teal",   label: "Teal",   swatch: "bg-teal-400",   card: "bg-teal-500/10 border-teal-500/30" },
  { id: "sky",    label: "Sky",    swatch: "bg-sky-400",    card: "bg-sky-500/10 border-sky-500/30" },
  { id: "indigo", label: "Indigo", swatch: "bg-indigo-400", card: "bg-indigo-500/10 border-indigo-500/30" },
  { id: "violet", label: "Violet", swatch: "bg-violet-400", card: "bg-violet-500/10 border-violet-500/30" },
  { id: "rose",   label: "Rose",   swatch: "bg-rose-400",   card: "bg-rose-500/10 border-rose-500/30" },
];

type FieldConfig = {
  startDateLabel: string;
  endDateLabel: string;
  startTimeLabel: string;
  endTimeLabel: string;
  startTimeRequired: boolean;
  startLocationLabel: string | null;
  endLocationLabel: string | null;
  providerLabel: string;
  showDuration: boolean;
  showPartySize: boolean;
  titlePlaceholder: string;
};

function getFieldConfig(type: string): FieldConfig {
  switch (type) {
    case "FLIGHT":
      return {
        startDateLabel: "Departure date",
        endDateLabel: "Arrival date",
        startTimeLabel: "Departure time *",
        endTimeLabel: "Arrival time",
        startTimeRequired: true,
        startLocationLabel: "From",
        endLocationLabel: "To",
        providerLabel: "Airline",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. EI116 IAD → DUB",
      };
    case "HOTEL":
      return {
        startDateLabel: "Check-in date",
        endDateLabel: "Checkout date",
        startTimeLabel: "Check-in time *",
        endTimeLabel: "Checkout time",
        startTimeRequired: true,
        startLocationLabel: "Address",
        endLocationLabel: null,
        providerLabel: "Booking platform",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. Hilton Tokyo",
      };
    case "AIRBNB":
      return {
        startDateLabel: "Check-in date",
        endDateLabel: "Checkout date",
        startTimeLabel: "Check-in time *",
        endTimeLabel: "Checkout time",
        startTimeRequired: true,
        startLocationLabel: "Address",
        endLocationLabel: null,
        providerLabel: "Platform",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. Cozy flat in Salzburg",
      };
    case "TRAIN":
      return {
        startDateLabel: "Departure date",
        endDateLabel: "Arrival date",
        startTimeLabel: "Departure time",
        endTimeLabel: "Arrival time",
        startTimeRequired: false,
        startLocationLabel: "Departure station",
        endLocationLabel: "Arrival station",
        providerLabel: "Operator",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. Eurostar London → Paris",
      };
    case "BUS":
      return {
        startDateLabel: "Departure date",
        endDateLabel: "Arrival date",
        startTimeLabel: "Departure time",
        endTimeLabel: "Arrival time",
        startTimeRequired: false,
        startLocationLabel: "From",
        endLocationLabel: "To",
        providerLabel: "Operator",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. FlixBus Vienna → Graz",
      };
    case "RENTAL_CAR":
      return {
        startDateLabel: "Pickup date",
        endDateLabel: "Drop-off date",
        startTimeLabel: "Pickup time",
        endTimeLabel: "Drop-off time",
        startTimeRequired: false,
        startLocationLabel: "Pickup location",
        endLocationLabel: "Drop-off location",
        providerLabel: "Rental company",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. Hertz compact, Vienna",
      };
    case "RESTAURANT":
      return {
        startDateLabel: "Reservation date",
        endDateLabel: "",
        startTimeLabel: "Reservation time *",
        endTimeLabel: "",
        startTimeRequired: true,
        startLocationLabel: "Address",
        endLocationLabel: null,
        providerLabel: "Platform",
        showDuration: false,
        showPartySize: true,
        titlePlaceholder: "e.g. Nobu Tokyo",
      };
    case "FOOD_TOUR":
      return {
        startDateLabel: "Date",
        endDateLabel: "",
        startTimeLabel: "Start time",
        endTimeLabel: "",
        startTimeRequired: false,
        startLocationLabel: "Location",
        endLocationLabel: null,
        providerLabel: "Provider",
        showDuration: true,
        showPartySize: false,
        titlePlaceholder: "e.g. Tsukiji Market tour",
      };
    case "CITY_TOUR":
      return {
        startDateLabel: "Date",
        endDateLabel: "",
        startTimeLabel: "Start time",
        endTimeLabel: "",
        startTimeRequired: false,
        startLocationLabel: "Location",
        endLocationLabel: null,
        providerLabel: "Provider",
        showDuration: true,
        showPartySize: false,
        titlePlaceholder: "e.g. Walking tour",
      };
    case "MUSEUM":
      return {
        startDateLabel: "Date",
        endDateLabel: "",
        startTimeLabel: "Start time",
        endTimeLabel: "",
        startTimeRequired: false,
        startLocationLabel: "Location",
        endLocationLabel: null,
        providerLabel: "Museum",
        showDuration: true,
        showPartySize: false,
        titlePlaceholder: "e.g. MoMA",
      };
    case "ACTIVITY":
      return {
        startDateLabel: "Date",
        endDateLabel: "",
        startTimeLabel: "Start time",
        endTimeLabel: "",
        startTimeRequired: false,
        startLocationLabel: "Location",
        endLocationLabel: null,
        providerLabel: "Provider",
        showDuration: true,
        showPartySize: false,
        titlePlaceholder: "e.g. Kayaking",
      };
    default:
      return {
        startDateLabel: "Start date",
        endDateLabel: "End date",
        startTimeLabel: "Start time",
        endTimeLabel: "End time",
        startTimeRequired: false,
        startLocationLabel: "Location",
        endLocationLabel: null,
        providerLabel: "Provider",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. Transfer",
      };
  }
}

function getTimeDisplayLabels(type: string) {
  const cfg = getFieldConfig(type);
  return {
    start: cfg.startTimeLabel.replace(" *", "").split(" ")[0],
    end: cfg.endTimeLabel.split(" ")[0],
  };
}

const EMPTY_FORM = {
  type: "FLIGHT" as const,
  title: "",
  confirmationCode: "",
  provider: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  startLocation: "",
  endLocation: "",
  city: "",
  state: "",
  durationMinutes: "" as string | number,
  partySize: "" as string | number,
  price: "",
  currency: "USD",
  notes: "",
  color: "",
  splitMode: "EVEN" as SplitMode,
  paidBy: OWNER_ID,
  participants: [{ friendId: OWNER_ID, inSplit: true, splitValue: null }] as SplitParticipant[],
};

export default function ReservationsList({
  tripId,
  reservations: initialReservations,
  friendMap,
  onUpdate,
}: {
  tripId: string;
  reservations: Reservation[];
  friendMap: Record<string, Friend>;
  onUpdate: (reservations: Reservation[]) => void;
}) {
  const [reservations, setReservations] = useState(initialReservations);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(r: Reservation) {
    setForm({
      type: r.type as typeof EMPTY_FORM.type,
      title: r.title,
      confirmationCode: r.confirmationCode ?? "",
      provider: r.provider ?? "",
      startDate: r.startDate ? r.startDate.slice(0, 10) : "",
      startTime: r.startTime ?? "",
      endDate: r.endDate ? r.endDate.slice(0, 10) : "",
      endTime: r.endTime ?? "",
      startLocation: r.startLocation ?? "",
      endLocation: r.endLocation ?? "",
      city: r.city ?? "",
      state: r.state ?? "",
      durationMinutes: r.durationMinutes ?? "",
      partySize: r.partySize ?? "",
      price: r.price ?? "",
      currency: r.currency,
      notes: r.notes ?? "",
      color: r.color ?? "",
      splitMode: r.splitMode as SplitMode,
      paidBy: r.paidBy,
      participants: r.participants.length > 0
        ? r.participants.map(p => ({ friendId: p.friendId, inSplit: p.inSplit, splitValue: p.splitValue != null ? parseFloat(p.splitValue) : null }))
        : [{ friendId: OWNER_ID, inSplit: true, splitValue: null }],
    });
    setEditId(r.id);
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editId
      ? `/api/trips/${tripId}/reservations/${editId}`
      : `/api/trips/${tripId}/reservations`;
    const res = await fetch(url, {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, splitParticipants: form.participants }),
    });
    if (res.ok) {
      const saved = await res.json();
      const next = editId
        ? reservations.map((r) => (r.id === editId ? saved : r))
        : [...reservations, saved].sort((a, b) =>
            (a.startDate ?? "").localeCompare(b.startDate ?? "")
          );
      setReservations(next);
      onUpdate(next);
      setShowForm(false);
    }
    setSaving(false);
  }

  async function deleteReservation(id: string) {
    if (!confirm("Delete this reservation?")) return;
    await fetch(`/api/trips/${tripId}/reservations/${id}`, { method: "DELETE" });
    const next = reservations.filter((r) => r.id !== id);
    setReservations(next);
    onUpdate(next);
  }

  async function uploadFile(reservationId: string, file: File) {
    setUploadingFor(reservationId);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/trips/${tripId}/reservations/${reservationId}/attachments`, {
      method: "POST",
      body: fd,
    });
    if (res.ok) {
      const att = await res.json();
      const next = reservations.map((r) =>
        r.id === reservationId ? { ...r, attachments: [...r.attachments, att] } : r
      );
      setReservations(next);
      onUpdate(next);
    }
    setUploadingFor(null);
  }

  async function deleteAttachment(reservationId: string, attachmentId: string) {
    await fetch(`/api/trips/${tripId}/reservations/${reservationId}/attachments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachmentId }),
    });
    const next = reservations.map((r) =>
      r.id === reservationId
        ? { ...r, attachments: r.attachments.filter((a) => a.id !== attachmentId) }
        : r
    );
    setReservations(next);
    onUpdate(next);
  }

  const friends = Object.values(friendMap);
  const cfg = getFieldConfig(form.type);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openAdd}
          className="bg-moss text-white text-sm px-4 py-2 hover:bg-moss"
        >
          + Add reservation
        </button>
      </div>

      {reservations.length === 0 && !showForm && (
        <div className="border border-dashed border-ink-faint p-10 text-center">
          <p className="font-display italic text-xl text-ink mb-1">No reservations yet</p>
          <p className="text-sm text-ink">Add flights, hotels, activities, and more.</p>
        </div>
      )}

      {reservations.map((r) => {
        const tl = getTimeDisplayLabels(r.type);
        return (
          <div key={r.id} className={`border p-4 ${r.color ? (BOOKING_COLORS.find(c => c.id === r.color)?.card ?? TYPE_COLORS[r.type]) : (TYPE_COLORS[r.type] ?? "bg-panel border-ink-faint")}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">{RESERVATION_ICONS[r.type] ?? "📋"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-ink">{r.title}</h3>
                    <p className="text-xs text-ink">{r.type.replace(/_/g, " ").toLowerCase()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(r)} className="text-xs text-ink hover:text-ink">Edit</button>
                    <button onClick={() => deleteReservation(r.id)} className="text-xs text-ink hover:text-red-500">Delete</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 text-xs text-ink">
                  {(r.startDate || r.endDate) && (
                    <span>{formatDateRange(r.startDate, r.endDate)}</span>
                  )}
                  {(r.startTime || r.endTime) && (
                    <span className="font-mono">
                      {r.startTime && <span>{tl.start}: <span className="text-ink font-medium">{r.startTime}</span></span>}
                      {r.startTime && r.endTime && <span className="mx-1">·</span>}
                      {r.endTime && <span>{tl.end}: <span className="text-ink font-medium">{r.endTime}</span></span>}
                    </span>
                  )}
                  {r.durationMinutes && <span>{r.durationMinutes} min</span>}
                  {(r.startLocation || r.endLocation) && (
                    <span>{r.startLocation}{r.startLocation && r.endLocation ? " → " : ""}{r.endLocation}</span>
                  )}
                  {(r.city || r.state) && (
                    <span>{[r.city, r.state].filter(Boolean).join(", ")}</span>
                  )}
                  {r.provider && <span>{r.provider}</span>}
                  {r.type === "RESTAURANT" && r.partySize && <span>👥 {r.partySize}</span>}
                  {r.confirmationCode && <span>Conf: <span className="text-ink font-medium">{r.confirmationCode}</span></span>}
                  {r.price && <span>{formatPrice(r.price, r.currency)}</span>}
                </div>

                {r.notes && <p className="text-xs text-ink mt-1.5 italic">{r.notes}</p>}

                {r.participants.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.participants.map((p) => (
                      <span key={p.friendId} className="text-xs bg-surface/60 text-ink px-1.5 py-0.5 border border-ink-faint">
                        {personName(p.friendId, friendMap)}{!p.inSplit ? " (no split)" : ""}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2 space-y-1">
                  {r.attachments.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-xs">
                      <a
                        href={`/api/media/${a.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-moss hover:underline truncate max-w-48"
                      >
                        {a.originalName}
                      </a>
                      <button
                        onClick={() => deleteAttachment(r.id, a.id)}
                        className="text-ink hover:text-red-500 flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label className="cursor-pointer text-xs text-ink hover:text-ink flex items-center gap-1">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadFile(r.id, f);
                        e.target.value = "";
                      }}
                    />
                    {uploadingFor === r.id ? "Uploading…" : "+ Attach file"}
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 px-4 z-50">
          <div className="bg-surface w-full max-w-lg max-h-[80vh] overflow-y-auto border border-ink-faint">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-faint">
              <h2 className="font-display italic text-lg font-semibold">
                {editId ? "Edit reservation" : "Add reservation"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-ink hover:text-ink">✕</button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {/* Type + Title */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Type *">
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as typeof EMPTY_FORM.type, startTime: "", endTime: "", startLocation: "", endLocation: "", durationMinutes: "", partySize: "" })}
                    className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none"
                  >
                    {RESERVATION_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Title *">
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={cfg.titlePlaceholder}
                    className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none"
                    required
                  />
                </Field>
              </div>

              {/* Dates + times */}
              <div className="grid grid-cols-2 gap-4">
                <Field label={cfg.startDateLabel}>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                </Field>
                <Field label={cfg.startTimeLabel}>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required={cfg.startTimeRequired && !!form.startDate}
                    className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none font-mono"
                  />
                </Field>
              </div>

              {cfg.endDateLabel && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label={cfg.endDateLabel}>
                    <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                  </Field>
                  <Field label={`${cfg.endTimeLabel} (optional)`}>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none font-mono"
                    />
                  </Field>
                </div>
              )}

              {/* Duration */}
              {cfg.showDuration && (
                <Field label="Duration (minutes)">
                  <input type="number" min="0" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    placeholder="60" className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                </Field>
              )}

              {/* Location fields */}
              {cfg.startLocationLabel && cfg.endLocationLabel ? (
                <div className="grid grid-cols-2 gap-4">
                  <Field label={cfg.startLocationLabel}>
                    <input type="text" value={form.startLocation} onChange={(e) => setForm({ ...form, startLocation: e.target.value })}
                      className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                  </Field>
                  <Field label={cfg.endLocationLabel}>
                    <input type="text" value={form.endLocation} onChange={(e) => setForm({ ...form, endLocation: e.target.value })}
                      className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                  </Field>
                </div>
              ) : cfg.startLocationLabel ? (
                <Field label={cfg.startLocationLabel}>
                  <input type="text" value={form.startLocation} onChange={(e) => setForm({ ...form, startLocation: e.target.value })}
                    className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                </Field>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <Field label="City">
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. San Francisco"
                    className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                </Field>
                <Field label="State / Region">
                  <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="e.g. CA"
                    className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                </Field>
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: cfg.showPartySize ? "1fr 1fr" : "1fr" }}>
                <Field label={cfg.providerLabel}>
                  <input type="text" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                </Field>
                {cfg.showPartySize && (
                  <Field label="Party size">
                    <input
                      type="number"
                      min="1"
                      value={form.partySize}
                      onChange={(e) => setForm({ ...form, partySize: e.target.value })}
                      placeholder="2"
                      className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none"
                    />
                  </Field>
                )}
              </div>

              <Field label="Confirmation">
                <input type="text" value={form.confirmationCode} onChange={(e) => setForm({ ...form, confirmationCode: e.target.value })}
                  placeholder="e.g. ABC123" className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Field label="Price">
                    <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0.00" className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                  </Field>
                </div>
                <Field label="Currency">
                  <input type="text" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                </Field>
              </div>

              <Field label="Notes">
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none resize-none" />
              </Field>

              <Field label="Group color (optional — tag related reservations)">
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, color: "" })}
                    className={`w-7 h-7 border-2 flex items-center justify-center text-xs ${!form.color ? "border-ink" : "border-ink-faint hover:border-ink-muted"} bg-surface`}
                    title="No color"
                  >
                    ✕
                  </button>
                  {BOOKING_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setForm({ ...form, color: c.id })}
                      className={`w-7 h-7 rounded-full border-2 ${c.swatch} ${form.color === c.id ? "border-ink scale-110" : "border-transparent hover:border-ink-muted"} transition-transform`}
                      title={c.label}
                    />
                  ))}
                </div>
              </Field>

              <Field label="Who's on this & how to split">
                <SplitEditor
                  friends={friends}
                  value={{ splitMode: form.splitMode, paidBy: form.paidBy, participants: form.participants }}
                  price={form.price}
                  currency={form.currency}
                  onChange={(next) =>
                    setForm({ ...form, splitMode: next.splitMode, paidBy: next.paidBy, participants: next.participants })
                  }
                />
              </Field>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="bg-moss text-white text-sm px-4 py-2 hover:bg-moss disabled:opacity-50">
                  {saving ? "Saving…" : editId ? "Save changes" : "Add reservation"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="text-sm text-ink hover:text-ink px-3">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-ink mb-1.5">{label}</label>
      {children}
    </div>
  );
}
