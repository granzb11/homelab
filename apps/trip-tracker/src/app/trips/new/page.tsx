"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["PLANNING", "ACTIVE", "COMPLETED"] as const;

export default function NewTripPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    destination: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "PLANNING" as string,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Trip name is required"); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to create trip");
      setSaving(false);
      return;
    }
    const trip = await res.json();
    router.push(`/trips/${trip.id}`);
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="font-display italic text-3xl font-bold text-ink">Plan a new trip</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Trip name *">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Japan 2025"
            className="w-full border border-ink-faint bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-moss focus:outline-none"
          />
        </Field>

        <Field label="Destination">
          <input
            type="text"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            placeholder="e.g. Tokyo, Japan"
            className="w-full border border-ink-faint bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-moss focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start date">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full border border-ink-faint bg-white px-3 py-2 text-sm text-ink focus:border-moss focus:outline-none"
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full border border-ink-faint bg-white px-3 py-2 text-sm text-ink focus:border-moss focus:outline-none"
            />
          </Field>
        </div>

        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border border-ink-faint bg-white px-3 py-2 text-sm text-ink focus:border-moss focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Any notes about this trip…"
            className="w-full border border-ink-faint bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-moss focus:outline-none resize-none"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-moss text-white text-sm px-5 py-2.5 hover:bg-moss-dark disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create trip"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-ink-muted hover:text-ink px-3 py-2.5"
          >
            Cancel
          </button>
        </div>
      </form>
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
