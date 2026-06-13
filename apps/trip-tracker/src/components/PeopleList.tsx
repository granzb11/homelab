"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import type { Friend } from "@/lib/friends";

type TripParticipant = {
  id: string;
  tripId: string;
  friendId: string;
  joinDate: string | null;
  leaveDate: string | null;
  notes: string | null;
};

export default function PeopleList({
  tripId,
  participants: initialParticipants,
  friendMap,
  onUpdate,
}: {
  tripId: string;
  participants: TripParticipant[];
  friendMap: Record<string, Friend>;
  onUpdate: (participants: TripParticipant[]) => void;
}) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ friendId: "", joinDate: "", leaveDate: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const friends = Object.values(friendMap);
  const addedIds = new Set(participants.map((p) => p.friendId));
  const available = friends.filter((f) => !addedIds.has(f.id));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.friendId) return;
    setSaving(true);
    const res = await fetch(`/api/trips/${tripId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const p = await res.json();
      const next = [...participants, p];
      setParticipants(next);
      onUpdate(next);
      setForm({ friendId: "", joinDate: "", leaveDate: "", notes: "" });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function remove(id: string) {
    await fetch(`/api/trips/${tripId}/participants/${id}`, { method: "DELETE" });
    const next = participants.filter((p) => p.id !== id);
    setParticipants(next);
    onUpdate(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {available.length > 0 && (
          <button onClick={() => setShowForm(true)} className="bg-moss text-white text-sm px-4 py-2 hover:bg-moss-dark">
            + Add person
          </button>
        )}
      </div>

      {participants.length === 0 && (
        <div className="border border-dashed border-ink-faint p-10 text-center">
          <p className="font-display italic text-xl text-ink-muted mb-1">Just you so far</p>
          <p className="text-sm text-ink-muted">Add friends who are joining this trip.</p>
          {friends.length === 0 && (
            <p className="text-xs text-ink-muted mt-3">
              Friends are pulled from Friend Tracker. Make sure it&apos;s running.
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {participants.map((p) => {
          const friend = friendMap[p.friendId];
          return (
            <div key={p.id} className="flex items-center gap-4 border border-ink-faint bg-panel p-4">
              <div className="w-9 h-9 rounded-full bg-moss-tint flex items-center justify-center text-moss font-medium text-sm flex-shrink-0">
                {friend?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm">{friend?.name ?? p.friendId}</p>
                {(p.joinDate || p.leaveDate) && (
                  <p className="text-xs text-ink-muted">
                    {p.joinDate ? formatDate(p.joinDate) : "Start"} → {p.leaveDate ? formatDate(p.leaveDate) : "End"}
                  </p>
                )}
                {!p.joinDate && !p.leaveDate && (
                  <p className="text-xs text-ink-muted">Full trip</p>
                )}
                {p.notes && <p className="text-xs text-ink-muted italic">{p.notes}</p>}
              </div>
              <button onClick={() => remove(p.id)} className="text-xs text-ink-muted hover:text-red-500 flex-shrink-0">
                Remove
              </button>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 px-4 z-50">
          <div className="bg-surface w-full max-w-sm border border-ink-faint">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-faint">
              <h2 className="font-display italic text-lg font-semibold">Add person</h2>
              <button onClick={() => setShowForm(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <form onSubmit={add} className="p-5 space-y-4">
              <Field label="Friend *">
                <select value={form.friendId} onChange={(e) => setForm({ ...form, friendId: e.target.value })}
                  required className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none">
                  <option value="">Select a friend…</option>
                  {available.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </Field>

              <p className="text-xs text-ink-muted">Leave dates empty if they&apos;re joining the full trip.</p>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Joins on">
                  <input type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                    className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                </Field>
                <Field label="Leaves on">
                  <input type="date" value={form.leaveDate} onChange={(e) => setForm({ ...form, leaveDate: e.target.value })}
                    className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
                </Field>
              </div>

              <Field label="Notes">
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any notes…"
                  className="w-full border border-ink-faint bg-surface px-3 py-2 text-sm focus:border-moss focus:outline-none" />
              </Field>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="bg-moss text-white text-sm px-4 py-2 hover:bg-moss-dark disabled:opacity-50">
                  {saving ? "Adding…" : "Add to trip"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="text-sm text-ink-muted hover:text-ink px-3">Cancel</button>
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
      <label className="block text-xs text-ink-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}
