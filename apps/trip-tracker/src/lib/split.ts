import type { Friend } from "@/lib/friends";

// The trip owner ("You") is a synthetic person. It can appear as a participant
// friendId and as an item's paidBy. No external friend record exists for it.
export const OWNER_ID = "__you__";

export type SplitMode = "EVEN" | "PERCENT" | "AMOUNT";

export type SplitParticipant = {
  friendId: string;
  inSplit: boolean;
  splitValue: number | null;
};

export type SplitState = {
  splitMode: SplitMode;
  paidBy: string;
  participants: SplitParticipant[];
};

export type SplitItem = {
  id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
  paidBy: string;
  splitMode: SplitMode;
  participants: SplitParticipant[];
};

export function personName(id: string, friendMap: Record<string, Friend>): string {
  if (id === OWNER_ID) return "You";
  return friendMap[id]?.name ?? "Friend";
}

export function personInitial(id: string, friendMap: Record<string, Friend>): string {
  return personName(id, friendMap).trim().charAt(0).toUpperCase() || "?";
}

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "object" ? parseFloat(String(v)) : Number(v);
  return isNaN(n) ? 0 : n;
}

/**
 * Each in-split participant's share of one item's cost.
 * EVEN: price / n. PERCENT: price * value/100. AMOUNT: value (fixed).
 * Items with no price or no in-split people contribute nothing.
 */
export function computeShares(item: SplitItem): Map<string, number> {
  const shares = new Map<string, number>();
  const price = toNum(item.price);
  if (price <= 0) return shares;

  const members = item.participants.filter((p) => p.inSplit);
  if (members.length === 0) return shares;

  if (item.splitMode === "EVEN") {
    const each = price / members.length;
    for (const m of members) shares.set(m.friendId, each);
  } else if (item.splitMode === "PERCENT") {
    for (const m of members) shares.set(m.friendId, price * (toNum(m.splitValue) / 100));
  } else {
    // AMOUNT
    for (const m of members) shares.set(m.friendId, toNum(m.splitValue));
  }
  return shares;
}

/**
 * Net balance per person across all items.
 * net = (amount this person fronted) - (their total share).
 * Positive = they are owed money; negative = they owe.
 */
export function computeBalances(items: SplitItem[]): Map<string, number> {
  const balances = new Map<string, number>();
  const bump = (id: string, delta: number) =>
    balances.set(id, (balances.get(id) ?? 0) + delta);

  for (const item of items) {
    const price = toNum(item.price);
    const shares = computeShares(item);
    if (shares.size === 0) continue;
    // payer fronted the full price
    bump(item.paidBy, price);
    for (const [id, share] of shares) bump(id, -share);
  }

  // Drop negligible residue from floating point.
  for (const [id, v] of balances) {
    if (Math.abs(v) < 0.005) balances.set(id, 0);
  }
  return balances;
}

/**
 * Normalize an API request body into participant create rows.
 * Prefers `splitParticipants: [{friendId, inSplit, splitValue}]`; falls back to
 * the legacy `friendIds: string[]` (all in-split) so older clients keep working.
 * Returns null when neither key is present (caller should leave participants untouched).
 */
export function parseSplitParticipants(
  body: { splitParticipants?: unknown; friendIds?: unknown }
): { friendId: string; inSplit: boolean; splitValue: number | null }[] | null {
  if (Array.isArray(body.splitParticipants)) {
    return body.splitParticipants
      .filter((p): p is Record<string, unknown> => !!p && typeof p === "object" && typeof (p as Record<string, unknown>).friendId === "string")
      .map((p) => {
        const sv = (p as Record<string, unknown>).splitValue;
        const parsed = sv === null || sv === undefined || sv === "" ? null : parseFloat(String(sv));
        return {
          friendId: String((p as Record<string, unknown>).friendId),
          inSplit: (p as Record<string, unknown>).inSplit !== false,
          splitValue: parsed !== null && !isNaN(parsed) ? parsed : null,
        };
      });
  }
  if (Array.isArray(body.friendIds)) {
    return (body.friendIds as unknown[])
      .filter((id): id is string => typeof id === "string")
      .map((friendId) => ({ friendId, inSplit: true, splitValue: null }));
  }
  return null;
}

export type Transfer = { from: string; to: string; amount: number };

/**
 * Minimal set of payments that zeroes everyone out. Greedy: repeatedly match
 * the largest debtor against the largest creditor.
 */
export function settleUp(balances: Map<string, number>): Transfer[] {
  const creditors: { id: string; amt: number }[] = [];
  const debtors: { id: string; amt: number }[] = [];
  for (const [id, v] of balances) {
    if (v > 0.005) creditors.push({ id, amt: v });
    else if (v < -0.005) debtors.push({ id, amt: -v });
  }
  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const amount = Math.min(c.amt, d.amt);
    if (amount > 0.005) {
      transfers.push({ from: d.id, to: c.id, amount: Math.round(amount * 100) / 100 });
    }
    c.amt -= amount;
    d.amt -= amount;
    if (c.amt < 0.005) ci++;
    if (d.amt < 0.005) di++;
  }
  return transfers;
}
