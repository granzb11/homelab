"use client";

import { useEffect, useState } from "react";
import { FriendCard } from "@/components/FriendCard";
import { useRouter } from "next/navigation";

interface Friend {
  id: string;
  name: string;
  avatarUrl: string | null;
  lastHangout: string | null;
  daysSinceSeen: number | null;
}

const inputClass =
  "w-full border border-ink-faint rounded-lg px-3 py-2 text-sm bg-white text-ink placeholder:text-ink-muted focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss";

export default function FriendsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/friends").then((r) => r.json()).then(setFriends);
  }, []);

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, notes: newNotes }),
    });
    if (res.ok) {
      const created = await res.json();
      setFriends((prev) =>
        [...prev, { ...created, lastHangout: null, daysSinceSeen: null }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setNewName("");
      setNewNotes("");
      setAdding(false);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-semibold text-ink">Friends</h1>
        <button
          onClick={() => setAdding((v) => !v)}
          className="bg-moss text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-moss-dark"
        >
          Add friend
        </button>
      </div>

      {adding && (
        <form
          onSubmit={addFriend}
          className="bg-white border border-ink-faint rounded-xl p-4 mb-6 space-y-3 max-w-md"
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Friend's name"
            className={inputClass}
          />
          <input
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notes (optional)"
            className={inputClass}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-moss text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-moss-dark disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-4 py-2 text-sm text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {friends.length === 0 ? (
        <p className="text-ink-muted text-sm">No friends yet. Add one above.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {friends.map((f) => <FriendCard key={f.id} {...f} />)}
        </div>
      )}
    </div>
  );
}
