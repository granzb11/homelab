"use client";

import { useState } from "react";
import type { Friend } from "@/lib/friends";
import SplitEditor from "./SplitEditor";
import {
  EVENT_TYPES,
  EMPTY_FORM,
  getFieldConfig,
  eventToForm,
  Field,
  type Event,
  type EventFormShape,
} from "./eventFormShared";

export default function EventFormModal({
  tripId,
  friendMap,
  editingEvent,
  prefill,
  onSaved,
  onClose,
}: {
  tripId: string;
  friendMap: Record<string, Friend>;
  editingEvent?: Event | null;
  prefill?: Partial<EventFormShape>;
  onSaved: (event: Event | Event[]) => void;
  onClose: () => void;
}) {
  const editId = editingEvent?.id ?? null;
  const [form, setForm] = useState<EventFormShape>(() =>
    editingEvent ? eventToForm(editingEvent) : { ...EMPTY_FORM, ...prefill }
  );
  const [saving, setSaving] = useState(false);

  const friends = Object.values(friendMap);
  const cfg = getFieldConfig(form.type);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editId
      ? `/api/trips/${tripId}/events/${editId}`
      : `/api/trips/${tripId}/events`;
    const res = await fetch(url, {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, splitParticipants: form.participants }),
    });
    if (res.ok) {
      const result = await res.json();
      onSaved(result.route ? (result.events as Event[]) : (result as Event));
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 px-4 z-50">
      <div className="bg-surface w-full max-w-lg max-h-[80vh] overflow-y-auto border border-ink-faint">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-faint">
          <h2 className="font-display text-lg font-semibold">
            {editId ? "Edit event" : "Add event"}
          </h2>
          <button onClick={onClose} className="text-ink hover:text-ink">✕</button>
        </div>
        <form onSubmit={save} className="p-5 space-y-4">
          {/* Title + Type */}
          <div className="grid grid-cols-2 gap-4">
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
            <Field label="Type *">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as typeof EMPTY_FORM.type, startTime: "", endTime: "", startLocation: "", endLocation: "", durationMinutes: "", partySize: "" })}
                className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
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

          <Field label="Link (optional — listing/confirmation URL, powers the photo. A multi-stop Google Maps route link adds every stop as its own event)">
            <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://…" className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
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
              {saving ? "Saving…" : editId ? "Save changes" : "Add event"}
            </button>
            <button type="button" onClick={onClose}
              className="text-sm text-ink hover:text-ink px-3">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
