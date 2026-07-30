"use client";

import { useState } from "react";

export type Restaurant = {
  id: string;
  tripId: string;
  name: string;
  cuisine: string | null;
  location: string | null;
  url: string | null;
  status: "WANT_TO_GO" | "VISITED";
  visitedWith: string | null;
  notes: string | null;
  visitedAt: string | null;
  createdAt: string;
};

type Tab = "WANT_TO_GO" | "VISITED";

const BLANK_FORM = {
  name: "",
  cuisine: "",
  location: "",
  url: "",
  status: "WANT_TO_GO" as Tab,
  visitedWith: "",
  notes: "",
};

export default function RestaurantsClient({ tripId, initialRestaurants }: { tripId: string; initialRestaurants: Restaurant[] }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const [tab, setTab] = useState<Tab>("WANT_TO_GO");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = restaurants.filter((r) => r.status === tab);

  function openForm() {
    setForm(BLANK_FORM);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          cuisine: form.cuisine || null,
          location: form.location || null,
          url: form.url || null,
          status: form.status,
          visitedWith: form.visitedWith || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const created = await res.json();
      setRestaurants((prev) => [created, ...prev]);
      setTab(form.status);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function markVisited(r: Restaurant) {
    setMarkingId(r.id);
    try {
      const res = await fetch(`/api/trips/${tripId}/restaurants/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VISITED", visitedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setRestaurants((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
      setTab("VISITED");
    } finally {
      setMarkingId(null);
    }
  }

  async function deleteRestaurant(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/trips/${tripId}/restaurants/${id}`, { method: "DELETE" });
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const wantCount = restaurants.filter((r) => r.status === "WANT_TO_GO").length;
  const visitedCount = restaurants.filter((r) => r.status === "VISITED").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink leading-tight">Restaurants</h1>
          <p className="text-ink-muted text-sm mt-1">
            {wantCount} to try · {visitedCount} visited
          </p>
        </div>
        <button
          onClick={openForm}
          className="bg-moss text-white text-sm px-4 py-2 rounded-md hover:bg-moss-dark transition-colors duration-150 flex-shrink-0"
        >
          Add restaurant
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-ink-faint">
        {(["WANT_TO_GO", "VISITED"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm transition-colors duration-150 border-b-2 -mb-px ${
              tab === t
                ? "border-moss text-moss font-medium"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t === "WANT_TO_GO" ? "Want to Go" : "Visited"}
            <span className="ml-2 text-xs opacity-60">
              {t === "WANT_TO_GO" ? wantCount : visitedCount}
            </span>
          </button>
        ))}
      </div>

      {/* Restaurant list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-muted text-sm">
          {tab === "WANT_TO_GO" ? "No restaurants saved yet." : "No visits logged yet."}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              onMarkVisited={() => markVisited(r)}
              onDelete={() => deleteRestaurant(r.id)}
              marking={markingId === r.id}
              deleting={deletingId === r.id}
            />
          ))}
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-surface border border-ink-faint rounded-xl w-full max-w-lg shadow-lg">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-ink-faint">
              <h2 className="font-display text-lg font-semibold">Add restaurant</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-ink-muted hover:text-ink transition-colors duration-150 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs text-ink-muted mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Restaurant name"
                  className="w-full bg-panel border border-ink-faint rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-moss transition-colors duration-150"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Cuisine</label>
                  <input
                    value={form.cuisine}
                    onChange={(e) => setForm((f) => ({ ...f, cuisine: e.target.value }))}
                    placeholder="Italian, Japanese…"
                    className="w-full bg-panel border border-ink-faint rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-moss transition-colors duration-150"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Tab }))}
                    className="w-full bg-panel border border-ink-faint rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:border-moss transition-colors duration-150"
                  >
                    <option value="WANT_TO_GO">Want to go</option>
                    <option value="VISITED">Visited</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="City, neighborhood…"
                  className="w-full bg-panel border border-ink-faint rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-moss transition-colors duration-150"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">Link</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://maps.google.com/…"
                  className="w-full bg-panel border border-ink-faint rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-moss transition-colors duration-150"
                />
              </div>
              {form.status === "VISITED" && (
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Went with</label>
                  <input
                    value={form.visitedWith}
                    onChange={(e) => setForm((f) => ({ ...f, visitedWith: e.target.value }))}
                    placeholder="Names…"
                    className="w-full bg-panel border border-ink-faint rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-moss transition-colors duration-150"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-ink-muted mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="What to order, highlights…"
                  rows={3}
                  className="w-full bg-panel border border-ink-faint rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-moss transition-colors duration-150 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-ink-muted hover:text-ink transition-colors duration-150 px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-moss text-white text-sm px-5 py-2 rounded-md hover:bg-moss-dark transition-colors duration-150 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RestaurantCard({
  restaurant: r,
  onMarkVisited,
  onDelete,
  marking,
  deleting,
}: {
  restaurant: Restaurant;
  onMarkVisited: () => void;
  onDelete: () => void;
  marking: boolean;
  deleting: boolean;
}) {
  return (
    <div className="bg-panel border border-ink-faint rounded-lg px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-ink text-sm">{r.name}</span>
          {r.cuisine && (
            <span className="text-xs px-2 py-0.5 bg-gold-tint text-gold rounded-full">
              {r.cuisine}
            </span>
          )}
        </div>
        {r.location && (
          <p className="text-xs text-ink-muted mt-0.5">{r.location}</p>
        )}
        {r.status === "VISITED" && r.visitedWith && (
          <p className="text-xs text-ink-muted mt-0.5">with {r.visitedWith}</p>
        )}
        {r.notes && (
          <p className="text-xs text-ink-muted mt-1 line-clamp-2">{r.notes}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {r.url && (
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-muted hover:text-moss transition-colors duration-150"
            title="Open link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        )}
        {r.status === "WANT_TO_GO" && (
          <button
            onClick={onMarkVisited}
            disabled={marking}
            title="Mark as visited"
            className="text-xs text-ink-muted hover:text-moss transition-colors duration-150 disabled:opacity-40"
          >
            {marking ? "…" : "✓"}
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={deleting}
          title="Delete"
          className="text-xs text-ink-muted hover:text-red-500 transition-colors duration-150 disabled:opacity-40"
        >
          {deleting ? "…" : "×"}
        </button>
      </div>
    </div>
  );
}
