"use client";

import { formatPrice } from "@/lib/utils";
import { OWNER_ID, personName, type SplitMode, type SplitState, type SplitParticipant } from "@/lib/split";
import type { Friend } from "@/lib/friends";

const MODES: { id: SplitMode; label: string }[] = [
  { id: "EVEN", label: "Even" },
  { id: "PERCENT", label: "Percent" },
  { id: "AMOUNT", label: "Amount" },
];

function num(v: number | null | undefined): number {
  return v == null || isNaN(v) ? 0 : v;
}

export default function SplitEditor({
  friends,
  value,
  price,
  currency,
  onChange,
}: {
  friends: Friend[];
  value: SplitState;
  price: string;
  currency: string;
  onChange: (next: SplitState) => void;
}) {
  const priceNum = parseFloat(price) || 0;
  const friendMap: Record<string, Friend> = Object.fromEntries(friends.map((f) => [f.id, f]));

  // People who can be added: You + every friend.
  const people: { id: string; name: string }[] = [
    { id: OWNER_ID, name: "You" },
    ...friends.map((f) => ({ id: f.id, name: f.name })),
  ];

  const selectedIds = new Set(value.participants.map((p) => p.friendId));
  const inSplit = value.participants.filter((p) => p.inSplit);

  // Seed per-person values evenly when first switching to a value-based mode,
  // so the user starts from a sensible 100% / fully-allocated baseline.
  function seed(mode: SplitMode, participants: SplitParticipant[]): SplitParticipant[] {
    const members = participants.filter((p) => p.inSplit);
    if (members.length === 0 || mode === "EVEN") return participants;
    const per =
      mode === "PERCENT"
        ? Math.round((100 / members.length) * 100) / 100
        : Math.round((priceNum / members.length) * 100) / 100;
    return participants.map((p) =>
      p.inSplit && p.splitValue == null ? { ...p, splitValue: per } : p
    );
  }

  function setMode(mode: SplitMode) {
    onChange({ ...value, splitMode: mode, participants: seed(mode, value.participants) });
  }

  function togglePerson(id: string) {
    if (selectedIds.has(id)) {
      const participants = value.participants.filter((p) => p.friendId !== id);
      onChange({
        ...value,
        participants,
        paidBy: value.paidBy === id ? OWNER_ID : value.paidBy,
      });
    } else {
      const added: SplitParticipant = { friendId: id, inSplit: true, splitValue: null };
      onChange({ ...value, participants: seed(value.splitMode, [...value.participants, added]) });
    }
  }

  function toggleInSplit(id: string) {
    const participants = value.participants.map((p) =>
      p.friendId === id ? { ...p, inSplit: !p.inSplit, splitValue: !p.inSplit ? p.splitValue : null } : p
    );
    onChange({ ...value, participants: seed(value.splitMode, participants) });
  }

  function setValue(id: string, raw: string) {
    const parsed = raw === "" ? null : parseFloat(raw);
    const participants = value.participants.map((p) =>
      p.friendId === id ? { ...p, splitValue: parsed != null && !isNaN(parsed) ? parsed : null } : p
    );
    onChange({ ...value, participants });
  }

  // Allocation status for the helper line.
  const allocated = inSplit.reduce((s, p) => s + num(p.splitValue), 0);
  const evenEach = inSplit.length > 0 ? priceNum / inSplit.length : 0;
  let helper: { text: string; ok: boolean } | null = null;
  if (value.splitMode === "PERCENT") {
    const diff = Math.round((100 - allocated) * 100) / 100;
    helper =
      Math.abs(diff) < 0.01
        ? { text: "100% allocated", ok: true }
        : { text: diff > 0 ? `${diff}% left to assign` : `over by ${Math.abs(diff)}%`, ok: false };
  } else if (value.splitMode === "AMOUNT") {
    const diff = Math.round((priceNum - allocated) * 100) / 100;
    helper =
      Math.abs(diff) < 0.01
        ? { text: "Fully allocated", ok: true }
        : { text: diff > 0 ? `${formatPrice(diff, currency)} left` : `over by ${formatPrice(Math.abs(diff), currency)}`, ok: false };
  } else if (priceNum > 0 && inSplit.length > 0) {
    helper = { text: `${formatPrice(evenEach, currency)} each`, ok: true };
  }

  // Paid-by options: You + selected participants (deduped).
  const payerOptions = [OWNER_ID, ...value.participants.map((p) => p.friendId)].filter(
    (id, i, arr) => arr.indexOf(id) === i
  );

  return (
    <div className="space-y-3">
      {/* Add / remove people */}
      <div className="flex flex-wrap gap-2 pt-1">
        {people.map((p) => {
          const checked = selectedIds.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePerson(p.id)}
              className={`text-xs px-2.5 py-1 border ${
                checked
                  ? "bg-moss text-white border-moss"
                  : "bg-surface text-ink border-ink-faint hover:border-moss"
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {value.participants.length > 0 && (
        <>
          {/* Split mode segmented control */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex border border-ink-faint">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`text-xs px-3 py-1.5 ${
                    value.splitMode === m.id ? "bg-moss text-white" : "bg-surface text-ink hover:text-ink"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {helper && (
              <span className={`text-xs ${helper.ok ? "text-moss" : "text-gold"}`}>{helper.text}</span>
            )}
          </div>

          {/* Per-person split rows */}
          <div className="border border-ink-faint divide-y divide-ink-faint">
            {value.participants.map((p) => {
              const share =
                value.splitMode === "EVEN"
                  ? p.inSplit
                    ? evenEach
                    : 0
                  : value.splitMode === "PERCENT"
                    ? priceNum * (num(p.splitValue) / 100)
                    : num(p.splitValue);
              return (
                <div key={p.friendId} className="flex items-center gap-2 px-3 py-2">
                  <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={p.inSplit}
                      onChange={() => toggleInSplit(p.friendId)}
                      className="accent-moss"
                    />
                    <span className={`text-sm truncate ${p.inSplit ? "text-ink" : "text-ink line-through"}`}>
                      {personName(p.friendId, friendMap)}
                    </span>
                  </label>

                  {!p.inSplit ? (
                    <span className="text-xs text-ink">not splitting</span>
                  ) : value.splitMode === "EVEN" ? (
                    <span className="text-xs text-ink whitespace-nowrap">
                      {priceNum > 0 ? formatPrice(share, currency) : "—"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {value.splitMode === "AMOUNT" && <span className="text-xs text-ink mr-1">{currency}</span>}
                        <input
                          type="number"
                          step={value.splitMode === "PERCENT" ? "1" : "0.01"}
                          value={p.splitValue ?? ""}
                          onChange={(e) => setValue(p.friendId, e.target.value)}
                          className="w-20 border border-ink-faint bg-surface px-2 py-1 text-sm focus:border-moss focus:outline-none"
                        />
                        {value.splitMode === "PERCENT" && <span className="text-xs text-ink ml-1">%</span>}
                      </div>
                      {value.splitMode === "PERCENT" && priceNum > 0 && (
                        <span className="text-xs text-ink whitespace-nowrap w-16 text-right">
                          {formatPrice(share, currency)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Paid by */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink">Paid by</label>
            <select
              value={value.paidBy}
              onChange={(e) => onChange({ ...value, paidBy: e.target.value })}
              className="border border-ink-faint bg-surface px-2 py-1 text-sm focus:border-moss focus:outline-none"
            >
              {payerOptions.map((id) => (
                <option key={id} value={id}>
                  {personName(id, friendMap)}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
