"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Friend { id: string; name: string; }

const inputClass =
  "border border-ink-faint rounded-lg px-3 py-2 text-sm bg-white text-ink placeholder:text-ink-muted focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss";

export function ReminderForm({ friends }: { friends: Friend[] }) {
  const router = useRouter();
  const [friendId, setFriendId] = useState("");
  const [days, setDays] = useState("30");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!friendId || !days) return;
    setSaving(true);
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId, thresholdDays: Number(days) }),
    });
    setFriendId("");
    setDays("30");
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">Friend</label>
        <select value={friendId} onChange={(e) => setFriendId(e.target.value)} className={inputClass}>
          <option value="">Select…</option>
          {friends.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">Alert after (days)</label>
        <input
          type="number"
          min={1}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className={inputClass + " w-24"}
        />
      </div>

      <button
        type="submit"
        disabled={saving || !friendId}
        className="bg-moss text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-moss-dark disabled:opacity-50"
      >
        {saving ? "Adding…" : "Add reminder"}
      </button>
    </form>
  );
}
