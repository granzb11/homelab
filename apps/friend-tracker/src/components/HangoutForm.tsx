"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Friend { id: string; name: string; }

const inputClass =
  "w-full border border-ink-faint rounded-lg px-3 py-2 text-sm bg-white text-ink placeholder:text-ink-muted focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss";

function GroupOrb({ count }: { count: number }) {
  const scale = count === 0 ? 0 : 0.5 + count * 0.18;
  const opacity = count === 0 ? 0 : 1;
  return (
    <div
      aria-hidden
      style={{
        width: 48,
        height: 48,
        transform: `scale(${scale})`,
        opacity,
        transition: "transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease",
        transformOrigin: "left center",
      }}
      className="relative shrink-0"
    >
      {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: i * 10,
            top: 0,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: `oklch(${0.35 + i * 0.06} 0.11 140)`,
            border: "2px solid white",
            boxShadow: "0 1px 3px oklch(0 0 0 / 0.15)",
          }}
        />
      ))}
    </div>
  );
}

function FriendPicker({ friends, selected, onChange }: {
  friends: Friend[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [animating, setAnimating] = useState<Record<string, "pop" | "release">>({});

  function toggle(id: string) {
    const adding = !selected.includes(id);
    setAnimating((prev) => ({ ...prev, [id]: adding ? "pop" : "release" }));
    onChange(adding ? [...selected, id] : selected.filter((x) => x !== id));
  }

  function clearAnim(id: string) {
    setAnimating((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 min-h-[48px]">
        <GroupOrb count={selected.length} />
        {selected.length > 0 && (
          <span style={{ transition: "opacity 200ms ease" }} className="text-xs text-moss font-medium">
            {selected.length === 1 ? "1 friend" : `${selected.length} friends`}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {friends.map((f) => {
          const on = selected.includes(f.id);
          const anim = animating[f.id];
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => toggle(f.id)}
              onAnimationEnd={() => clearAnim(f.id)}
              style={
                anim
                  ? { animation: `${anim === "pop" ? "pill-pop" : "pill-release"} 320ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards` }
                  : undefined
              }
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                on
                  ? "bg-moss text-white border-moss"
                  : "bg-white text-ink border-ink-faint hover:border-moss hover:text-moss"
              }`}
            >
              {f.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

async function lookupZip(zip: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) return null;
    const data = await res.json() as { places: Array<{ "place name": string; "state abbreviation": string }> };
    const place = data.places?.[0];
    if (!place) return null;
    return `${place["place name"]}, ${place["state abbreviation"]}`;
  } catch {
    return null;
  }
}

interface HangoutFormProps {
  friends: Friend[];
  defaultFriendId?: string;
  /** Pre-populated values for edit mode */
  defaultValues?: {
    id: string;
    title: string;
    eventType: string;
    location: string;
    city: string;
    startDate: string;
    endDate: string;
    whoTraveled: string;
    notes: string;
    friendIds: string[];
  };
}

export function HangoutForm({ friends, defaultFriendId, defaultValues }: HangoutFormProps) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const isEdit = !!defaultValues;

  const [friendIds, setFriendIds] = useState<string[]>(
    defaultValues?.friendIds ?? (defaultFriendId ? [defaultFriendId] : [])
  );
  const [startDate, setStartDate] = useState(defaultValues?.startDate ?? today);
  const [endDate, setEndDate] = useState(defaultValues?.endDate ?? "");
  const [notes, setNotes] = useState(defaultValues?.notes ?? "");
  const [location, setLocation] = useState(defaultValues?.location ?? "");
  const [zip, setZip] = useState("");
  const [zipResolved, setZipResolved] = useState("");
  const [zipLooking, setZipLooking] = useState(false);
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [eventType, setEventType] = useState(defaultValues?.eventType ?? "");
  const [city, setCity] = useState(defaultValues?.city ?? "");
  const [whoTraveled, setWhoTraveled] = useState(defaultValues?.whoTraveled ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleZipChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 5);
    setZip(digits);
    if (digits.length < 5) { setZipResolved(""); return; }
    setZipLooking(true);
    const resolved = await lookupZip(digits);
    setZipLooking(false);
    if (resolved) {
      setZipResolved(resolved);
      setCity(resolved);
    } else {
      setZipResolved("Not found");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (friendIds.length === 0 || !startDate) {
      setError("Please select at least one friend and a start date.");
      return;
    }
    setSaving(true); setError("");

    const payload = { friendIds, startDate, endDate: endDate || null, notes, location, eventType, city, whoTraveled, title };

    const res = isEdit
      ? await fetch(`/api/events/${defaultValues!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!res.ok) { setError("Failed to save. Try again."); setSaving(false); return; }

    if (isEdit) {
      router.back();
    } else if (friendIds.length === 1) {
      router.push(`/friends/${friendIds[0]}`);
    } else {
      router.push("/friends");
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-md">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">Title <span className="text-ink-muted/60">(optional)</span></label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mike's wedding, Colorado ski trip"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">
          Friends{" "}
          {friendIds.length > 0 && (
            <span className="text-moss">({friendIds.length} selected)</span>
          )}
        </label>
        <FriendPicker friends={friends} selected={friendIds} onChange={setFriendIds} />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">Event type <span className="text-ink-muted/60">(optional)</span></label>
        <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputClass}>
          <option value="">— select —</option>
          <option>Wedding</option>
          <option>Birthday</option>
          <option>Holiday Party</option>
          <option>Dinner</option>
          <option>Lunch</option>
          <option>Coffee</option>
          <option>Hotel</option>
          <option>Airbnb</option>
          <option>Trip</option>
          <option>Vacation</option>
          <option>Concert</option>
          <option>Music Festival</option>
          <option>Other</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">End date <span className="text-ink-muted/60">(optional)</span></label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">Who traveled <span className="text-ink-muted/60">(optional)</span></label>
        <select value={whoTraveled} onChange={(e) => setWhoTraveled(e.target.value)} className={inputClass}>
          <option value="">— select —</option>
          <option value="You">You</option>
          <option value="Them">Them</option>
          <option value="Both">Both</option>
          <option value="Neither">Neither (same city)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">
          Location <span className="text-ink-muted/60">(optional — used for map)</span>
        </label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Venue name"
            className={inputClass}
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City, State"
            className={inputClass}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative w-28 shrink-0">
            <input
              type="text"
              inputMode="numeric"
              value={zip}
              onChange={(e) => handleZipChange(e.target.value)}
              placeholder="US zip lookup"
              maxLength={5}
              className={inputClass}
            />
          </div>
          {(zipLooking || zipResolved) && (
            <span className={`self-center text-sm ${zipResolved === "Not found" ? "text-red-500" : "text-moss"}`}>
              {zipLooking ? "Looking up…" : zipResolved}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">
          Notes <span className="text-ink-muted/60">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder={'What did you do? Tip: end with "Next: <plan>" to show it on the dashboard'}
          className={inputClass + " resize-none"}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-moss text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-moss-dark disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Log hangout"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-ink-muted hover:text-ink border border-ink-faint"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
