"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const RELATIONSHIP_TYPES = [
  "Partner",
  "Siblings",
  "Parent / Child",
  "Coworkers",
  "Roommates",
  "Childhood friends",
];

interface RelatedFriend {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface Relationship {
  id: string;
  type: string;
  friend: RelatedFriend;
}

interface Props {
  friendId: string;
  relationships: Relationship[];
  allFriends: RelatedFriend[];
}

const inputClass =
  "w-full border border-ink-faint rounded-lg px-3 py-2 text-sm bg-white text-ink placeholder:text-ink-muted focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss";

export function RelationshipSection({ friendId, relationships: initial, allFriends }: Props) {
  const router = useRouter();
  const [relationships, setRelationships] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [type, setType] = useState(RELATIONSHIP_TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const alreadyLinked = new Set(relationships.map((r) => r.friend.id));

  async function save() {
    if (!selectedFriend) return;
    const resolvedType = type === "Other" ? customType.trim() : type;
    if (!resolvedType) return;
    setSaving(true);
    const res = await fetch("/api/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendAId: friendId, friendBId: selectedFriend, type: resolvedType }),
    });
    if (res.ok) {
      const created = await res.json();
      const other = allFriends.find((f) => f.id === selectedFriend)!;
      setRelationships((prev) => [...prev, { id: created.id, type: resolvedType, friend: other }]);
      setAdding(false);
      setSelectedFriend("");
      setType(RELATIONSHIP_TYPES[0]);
      setCustomType("");
      router.refresh();
    }
    setSaving(false);
  }

  async function remove(id: string) {
    setRemoving(id);
    await fetch(`/api/relationships/${id}`, { method: "DELETE" });
    setRelationships((prev) => prev.filter((r) => r.id !== id));
    setRemoving(null);
    router.refresh();
  }

  const availableFriends = allFriends.filter((f) => !alreadyLinked.has(f.id));

  return (
    <section className="border-t border-ink-faint pt-6 mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-ink-muted">Relationships</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-moss hover:text-moss-dark"
          >
            + Add
          </button>
        )}
      </div>

      {relationships.length === 0 && !adding && (
        <p className="text-sm text-ink-muted">No relationships set.</p>
      )}

      {relationships.length > 0 && (
        <ul className="space-y-2 mb-3">
          {relationships.map((r) => (
            <li key={r.id} className="flex items-center gap-3 text-sm bg-panel border border-ink-faint rounded-lg px-3 py-2">
              {r.friend.avatarUrl ? (
                <img src={r.friend.avatarUrl} alt={r.friend.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-moss-tint text-moss text-xs font-bold font-display italic flex items-center justify-center flex-shrink-0">
                  {r.friend.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                </div>
              )}
              <Link href={`/friends/${r.friend.id}`} className="font-medium text-ink hover:text-moss flex-1">
                {r.friend.name}
              </Link>
              <span className="text-ink-muted">{r.type}</span>
              <button
                onClick={() => remove(r.id)}
                disabled={removing === r.id}
                className="text-ink-muted hover:text-red-500 ml-1 disabled:opacity-40"
                title="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="bg-white border border-ink-faint rounded-xl p-4 space-y-3">
          <select
            value={selectedFriend}
            onChange={(e) => setSelectedFriend(e.target.value)}
            className={inputClass}
          >
            <option value="">Select a friend…</option>
            {availableFriends.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
          >
            {RELATIONSHIP_TYPES.map((t) => <option key={t}>{t}</option>)}
            <option value="Other">Other…</option>
          </select>

          {type === "Other" && (
            <input
              type="text"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="e.g. Bandmates"
              className={inputClass}
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !selectedFriend || (type === "Other" && !customType.trim())}
              className="bg-moss text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-moss-dark disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setAdding(false); setSelectedFriend(""); setType(RELATIONSHIP_TYPES[0]); setCustomType(""); }}
              className="px-4 py-2 text-sm text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
