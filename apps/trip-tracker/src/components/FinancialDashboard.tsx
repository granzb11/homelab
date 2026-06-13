"use client";

import { useState } from "react";
import { formatPrice, calculateTotalCost, calculateDailySpending, getDetailedDailySpending } from "@/lib/utils";

// Mid-lightness, moderate-chroma hues that read clearly on both light and dark grounds.
const CATEGORY_COLORS: Record<string, string> = {
  GROCERIES:     "#4b9a87",
  FOOD:          "#6b9b5a",
  TRANSPORT:     "#5b7fb5",
  ACTIVITIES:    "#b8922a",
  ACCOMMODATION: "#9b6ab8",
  ENTERTAINMENT: "#b85e48",
  OTHER:         "#7d8a99",
};
const FALLBACK_COLORS = ["#4b9a87","#6b9b5a","#5b7fb5","#b8922a","#9b6ab8","#b85e48","#7d8a99"];
function getCategoryColor(cat: string, idx: number): string {
  return CATEGORY_COLORS[cat] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

function CategoryLineChart({ expenses, currency }: { expenses: Expense[]; currency: string }) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const categories = [...new Set(expenses.map(e => e.category))].sort();
  const dates = [...new Set(
    expenses.filter(e => e.date).map(e => e.date!.slice(0, 10))
  )].sort();

  if (dates.length < 2 || categories.length === 0) {
    return (
      <div className="border border-dashed border-ink-faint p-8 text-center">
        <p className="text-sm text-ink-muted">Add at least 2 expenses with dates to see spending trends.</p>
      </div>
    );
  }

  // Build cumulative spend per category at each date point.
  const running: Record<string, number> = {};
  const cumulatives: Record<string, Record<string, number>> = {};
  for (const cat of categories) { running[cat] = 0; cumulatives[cat] = {}; }

  for (const date of dates) {
    for (const expense of expenses) {
      if (!expense.date || expense.date.slice(0, 10) !== date) continue;
      const amt = parseFloat(expense.amount || "0");
      if (!isNaN(amt)) running[expense.category] = (running[expense.category] || 0) + amt;
    }
    for (const cat of categories) cumulatives[cat][date] = running[cat] || 0;
  }

  const activeCategories = categories.filter(cat =>
    dates.some(d => (cumulatives[cat][d] || 0) > 0)
  );

  // SVG geometry
  const W = 560, H = 200;
  const padL = 52, padR = 16, padT = 12, padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const allValues = activeCategories.flatMap(cat => dates.map(d => cumulatives[cat][d] || 0));
  const yMax = Math.max(...allValues, 1);

  function xPos(i: number) { return padL + (i / Math.max(dates.length - 1, 1)) * chartW; }
  function yPos(v: number) { return padT + chartH - (v / yMax) * chartH; }
  function makePoints(cat: string) {
    return dates.map((d, i) => `${xPos(i)},${yPos(cumulatives[cat][d] || 0)}`).join(" ");
  }
  function formatY(v: number): string {
    return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;
  }

  const yTickValues = Array.from({ length: 5 }, (_, i) => (yMax / 4) * i);
  const maxXLabels = 6;
  const xLabelIndices = dates.length <= maxXLabels
    ? dates.map((_, i) => i)
    : Array.from({ length: maxXLabels }, (_, i) => Math.round(i * (dates.length - 1) / (maxXLabels - 1)));

  // Hovered category renders last so it appears on top.
  const orderedCategories = [
    ...activeCategories.filter(c => c !== hoveredCategory),
    ...(hoveredCategory && activeCategories.includes(hoveredCategory) ? [hoveredCategory] : []),
  ];

  // Sort categories by total descending for the table.
  const sortedActive = [...activeCategories].sort((a, b) => (running[b] || 0) - (running[a] || 0));
  const grandTotal = activeCategories.reduce((s, c) => s + (running[c] || 0), 0);

  return (
    <div className="border border-ink-faint p-4">
      <div className="flex gap-5 items-start">
        {/* Chart + legend */}
        <div className="flex-1 min-w-0 space-y-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height: 200 }}>
            {yTickValues.map((v, i) => (
              <g key={i}>
                <line x1={padL} y1={yPos(v)} x2={W - padR} y2={yPos(v)}
                  stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
                <text x={padL - 6} y={yPos(v) + 4}
                  textAnchor="end" fontSize="9" fill="currentColor" fillOpacity="0.4">
                  {formatY(v)}
                </text>
              </g>
            ))}
            {xLabelIndices.map(i => (
              <text key={i} x={xPos(i)} y={H - 6}
                textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.4">
                {new Date(dates[i] + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </text>
            ))}
            {orderedCategories.map((cat) => {
              const idx = activeCategories.indexOf(cat);
              const color = getCategoryColor(cat, idx);
              const isHovered = hoveredCategory === cat;
              const isDimmed = hoveredCategory !== null && !isHovered;
              const pts = makePoints(cat);
              const lastVal = cumulatives[cat][dates[dates.length - 1]] || 0;
              return (
                <g key={cat}
                  onMouseEnter={() => setHoveredCategory(cat)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  style={{ cursor: "default" }}
                >
                  <polyline points={pts} fill="none" stroke={color}
                    strokeWidth={isHovered ? 2.5 : 1.75}
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ opacity: isDimmed ? 0.15 : 1, transition: "opacity 120ms, stroke-width 120ms" }}
                  />
                  {lastVal > 0 && (
                    <circle cx={xPos(dates.length - 1)} cy={yPos(lastVal)}
                      r={isHovered ? 3.5 : 2.5} fill={color}
                      style={{ opacity: isDimmed ? 0.15 : 1, transition: "opacity 120ms" }}
                    />
                  )}
                  <polyline points={pts} fill="none" stroke="transparent" strokeWidth="14" />
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 px-1 border-t border-ink-faint pt-3">
            {activeCategories.map((cat, idx) => {
              const color = getCategoryColor(cat, idx);
              const isHovered = hoveredCategory === cat;
              const isDimmed = hoveredCategory !== null && !isHovered;
              return (
                <button key={cat} type="button"
                  className="flex items-center gap-1.5 transition-opacity"
                  style={{ opacity: isDimmed ? 0.25 : 1 }}
                  onMouseEnter={() => setHoveredCategory(cat)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <span className="inline-block w-4 flex-shrink-0 rounded-full"
                    style={{ height: "2px", backgroundColor: color }} />
                  <span className={`text-xs capitalize transition-colors ${isHovered ? "text-ink font-medium" : "text-ink-muted"}`}>
                    {cat.replace(/_/g, " ").toLowerCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Totals table — doubles as the legend */}
        <div className="flex-shrink-0 w-44 border-l border-ink-faint pl-4 self-stretch flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">Category total</p>
            <div className="space-y-1">
              {sortedActive.map((cat) => {
                const idx = activeCategories.indexOf(cat);
                const color = getCategoryColor(cat, idx);
                const total = running[cat] || 0;
                const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
                const isHovered = hoveredCategory === cat;
                const isDimmed = hoveredCategory !== null && !isHovered;
                return (
                  <button key={cat} type="button"
                    className="w-full flex items-center gap-2 py-1 text-left transition-opacity"
                    style={{ opacity: isDimmed ? 0.22 : 1 }}
                    onMouseEnter={() => setHoveredCategory(cat)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className={`text-xs capitalize flex-1 truncate transition-colors ${isHovered ? "text-ink font-medium" : "text-ink-muted"}`}>
                      {cat.replace(/_/g, " ").toLowerCase()}
                    </span>
                    <span className={`text-xs font-mono flex-shrink-0 transition-colors ${isHovered ? "text-ink font-medium" : "text-ink-muted"}`}>
                      {formatY(total)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t border-ink-faint pt-2 mt-2 flex justify-between items-baseline">
            <span className="text-xs text-ink-muted">Total</span>
            <span className="text-xs font-medium text-ink font-mono">{formatY(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
import { computeBalances, computeShares, settleUp, personName, personInitial, OWNER_ID, type SplitItem, type SplitMode } from "@/lib/split";
import type { Friend } from "@/lib/friends";

type SplitParticipantData = { friendId: string; inSplit: boolean; splitValue: string | null };

type Reservation = {
  id: string;
  type: string;
  title: string;
  price: string | null;
  currency: string;
  startDate: string | null;
  splitMode: string;
  paidBy: string;
  participants: SplitParticipantData[];
};

type Expense = {
  id: string;
  title: string;
  amount: string | null;
  currency: string;
  date: string | null;
  category: string;
  splitMode: string;
  paidBy: string;
  participants: SplitParticipantData[];
};

type Trip = {
  id: string;
  budget: string | null;
  startDate?: string | null;
  endDate?: string | null;
  reservations: Reservation[];
  expenses: Expense[];
  participants: { id: string }[];
};

function ProgressBar({ value, max, color = "moss" }: { value: number; max: number; color?: "moss" | "gold" }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 bg-ink-faint rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${color === "gold" ? "bg-gold" : "bg-moss"}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

function SparkLine({ values, height = 40 }: { values: number[]; height?: number }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const padding = 8;
  const width = 100;
  const chartHeight = height - padding * 2;

  const points = values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1 || 1)) * (width - padding * 2);
      const y = padding + chartHeight - (v / max) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: `${height}px` }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#sparkGradient)" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FinancialDashboard({
  trip,
  friendMap,
  onRefresh,
}: {
  trip: Trip;
  friendMap: Record<string, Friend>;
  onRefresh: () => void;
}) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

  // All financial calculations use expenses only
  const allItems = trip.expenses.map(e => ({ ...e, type: e.category, price: e.amount, startDate: e.date }));

  const totalCost = calculateTotalCost(allItems);
  const budget = trip.budget ? parseFloat(trip.budget) : null;
  const participantCount = trip.participants.length;
  const perPersonCost = participantCount > 0 ? totalCost / participantCount : 0;

  // Calculate daily average
  let dailyAverage = 0;
  if (trip.startDate && trip.endDate) {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const daysInTrip = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    dailyAverage = daysInTrip > 0 ? totalCost / daysInTrip : 0;
  }

  const dailySpending = calculateDailySpending(allItems);
  const detailedByDate = getDetailedDailySpending(allItems);

  // ---- Bill splitting ----
  const currency = trip.expenses[0]?.currency || "USD";

  const splitItems: SplitItem[] = trip.expenses.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.category,
    price: e.amount ? parseFloat(e.amount) : 0,
    currency: e.currency,
    paidBy: e.paidBy || OWNER_ID,
    splitMode: (e.splitMode as SplitMode) || "EVEN",
    participants: (e.participants || []).map((p) => ({
      friendId: p.friendId,
      inSplit: p.inSplit,
      splitValue: p.splitValue != null ? parseFloat(p.splitValue) : null,
    })),
  }));

  const balances = computeBalances(splitItems);

  const peopleInSplit = Array.from(
    new Set(
      splitItems.flatMap((it) =>
        computeShares(it).size > 0
          ? [it.paidBy, ...it.participants.filter((p) => p.inSplit).map((p) => p.friendId)]
          : []
      )
    )
  ).sort((a, b) => {
    if (a === OWNER_ID) return -1;
    if (b === OWNER_ID) return 1;
    return Math.abs(balances.get(b) ?? 0) - Math.abs(balances.get(a) ?? 0);
  });

  const transfers = settleUp(balances);
  const hasSplitData = peopleInSplit.length > 0;

  function personItems(personId: string) {
    return splitItems
      .map((it) => {
        const shares = computeShares(it);
        const hasSplitData = it.participants.length > 0;
        const share = shares.get(personId) ?? 0;
        const paid = it.paidBy === personId ? it.price : 0;

        // If no split participants, treat as fully owned by paidBy
        const ownsFullPrice = !hasSplitData && it.paidBy === personId;

        return {
          it,
          share: ownsFullPrice ? it.price : share,
          paid: 0,  // Don't double-count paid amounts; include in share instead
          inSplit: shares.has(personId) || ownsFullPrice
        };
      })
      .filter((r) => r.inSplit || r.paid > 0);
  }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wide">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group relative border border-ink-faint p-5 hover:bg-panel hover:border-moss transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-ink-muted mb-1 font-medium">Total cost</p>
                <p className="text-3xl font-medium text-ink">{formatPrice(totalCost, "USD")}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-moss/10 flex items-center justify-center text-xs text-moss font-medium">
                {trip.expenses.length}
              </div>
            </div>
            <p className="text-xs text-ink-muted">{trip.expenses.length} expense{trip.expenses.length !== 1 ? "s" : ""}</p>
          </div>

          {budget !== null && (
            <div className="group relative border border-ink-faint p-5 hover:bg-panel hover:border-moss transition-all duration-200">
              <div className="mb-3">
                <p className="text-xs text-ink-muted mb-1 font-medium">Budget vs Spent</p>
                <p className="text-3xl font-medium text-ink">{formatPrice(budget - totalCost, "USD")}</p>
              </div>
              <ProgressBar value={totalCost} max={budget} color={totalCost > budget ? "gold" : "moss"} />
              <p className={`text-xs mt-2 ${totalCost > budget ? "text-gold" : "text-moss"}`}>
                {totalCost > budget ? `Over by ${formatPrice(totalCost - budget, "USD")}` : `${Math.round(((budget - totalCost) / budget) * 100)}% remaining`}
              </p>
            </div>
          )}

          {(() => {
            const ownerRows = personItems(OWNER_ID);
            const ownerCost = ownerRows.reduce((s, r) => s + r.share, 0);
            const ownerPercentage = totalCost > 0 ? (ownerCost / totalCost) * 100 : 0;
            return (
              <div className="group relative border border-ink-faint p-5 hover:bg-panel hover:border-moss transition-all duration-200">
                <div>
                  <p className="text-xs text-ink-muted mb-1 font-medium">Your cost</p>
                  <p className="text-3xl font-medium text-ink">{formatPrice(ownerCost, "USD")}</p>
                </div>
                <p className="text-xs text-ink-muted mt-3">{ownerPercentage.toFixed(0)}% of total</p>
              </div>
            );
          })()}

          {trip.startDate && trip.endDate && (
            <div className="group relative border border-ink-faint p-5 hover:bg-panel hover:border-moss transition-all duration-200">
              <div>
                <p className="text-xs text-ink-muted mb-1 font-medium">Daily average</p>
                <p className="text-3xl font-medium text-ink">{formatPrice(dailyAverage, "USD")}</p>
              </div>
              <p className="text-xs text-ink-muted mt-3">{Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day{Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      </div>

      {/* Spending by category — line chart */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wide">Spending by category</h2>
        <CategoryLineChart expenses={trip.expenses} currency={currency} />
      </div>

      {/* Cost breakdown by person */}
      {hasSplitData && (
        <div className="space-y-4">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wide">Cost per person</h2>
          <div className="border border-ink-faint divide-y divide-ink-faint">
            {peopleInSplit.map((id) => {
              const rows = personItems(id);
              const shareTotal = rows.reduce((s, r) => s + r.share, 0);
              const percentage = totalCost > 0 ? (shareTotal / totalCost) * 100 : 0;
              const isExpanded = expandedPerson === id;

              return (
                <button
                  key={id}
                  onClick={() => setExpandedPerson(isExpanded ? null : id)}
                  className="w-full text-left p-4 hover:bg-panel transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-moss text-white flex items-center justify-center text-xs font-medium">
                      {personInitial(id, friendMap)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink">{personName(id, friendMap)}</p>
                    </div>
                    <div className="text-right mr-2">
                      <p className="text-sm font-medium text-ink">{formatPrice(shareTotal, currency)}</p>
                      <p className="text-xs text-ink-muted">{percentage.toFixed(0)}% of total</p>
                    </div>
                    <div className="text-ink-muted text-lg">{isExpanded ? "−" : "+"}</div>
                  </div>
                  <ProgressBar value={shareTotal} max={totalCost} />

                  {/* Expanded breakdown */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-ink-faint space-y-2">
                      {rows.map(({ it, share }) => {
                        const itemPercentage = it.price > 0 ? (share / it.price) * 100 : 0;
                        return (
                          <div key={it.id} className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-ink font-medium truncate flex-1">{it.title}</span>
                              <span className="text-xs font-medium text-ink-muted whitespace-nowrap ml-2">{formatPrice(share, currency)}</span>
                            </div>
                            {share > 0 && it.price > 0 && (
                              <div className="flex items-center gap-2">
                                <ProgressBar value={share} max={it.price} />
                                <span className="text-xs text-ink-muted whitespace-nowrap w-10 text-right">{itemPercentage.toFixed(0)}%</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily breakdown */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wide">Daily spending</h2>
        </div>
        {(() => {
          const dailyEntries = Object.entries(dailySpending)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
          const dailyValues = dailyEntries.map(([, amount]) => amount);
          return (
            <div className="border border-ink-faint p-4">
              {dailyValues.length > 1 && (
                <div className="mb-4 h-12">
                  <SparkLine values={dailyValues} height={40} />
                </div>
              )}
              <div className="space-y-1.5">
                {dailyEntries.map(([date, amount]) => {
                  const percentage = totalCost > 0 ? (amount / totalCost) * 100 : 0;
                  const isExpanded = expandedDay === date;
                  const dayItems = detailedByDate[date] || [];
                  return (
                    <div key={date}>
                      <button
                        onClick={() => setExpandedDay(isExpanded ? null : date)}
                        className="w-full flex justify-between items-center hover:bg-panel px-2 py-1.5 rounded transition-colors text-left"
                      >
                        <span className="text-xs text-ink-muted min-w-24 font-medium">
                          {new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}
                        </span>
                        <div className="flex-1 mx-3">
                          <ProgressBar value={amount} max={Math.max(...dailyValues, 1)} />
                        </div>
                        <span className="text-xs font-medium text-ink min-w-16 text-right">{formatPrice(amount, "USD")}</span>
                        <span className="text-ink-muted text-xs ml-2 w-4 text-center">{isExpanded ? "−" : "+"}</span>
                      </button>
                      {isExpanded && dayItems.length > 0 && (
                        <div className="bg-panel border border-t-0 border-ink-faint p-3 space-y-2">
                          {dayItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-start text-xs hover:bg-surface/50 px-2 py-1.5 rounded transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-ink font-medium truncate">{item.name}</p>
                                <p className="text-ink-muted text-xs capitalize">{item.type.replace(/_/g, " ")}</p>
                              </div>
                              <span className="text-ink font-medium whitespace-nowrap ml-2">{formatPrice(item.price, "USD")}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Splitting */}
      <div className="space-y-4">
        <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wide">Bill splitting</h2>
        {!hasSplitData ? (
          <div className="border border-ink-faint bg-panel p-6 text-center">
            <p className="text-sm text-ink-muted">Add prices and choose who splits each reservation to see who owes whom.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Balances section */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-ink-muted">Who owes whom</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {peopleInSplit.map((id) => {
                  const net = balances.get(id) ?? 0;
                  const isOwner = id === OWNER_ID;
                  const isExpanded = expandedPerson === id;
                  const isSettled = Math.abs(net) < 0.005;

                  let statusColor = "text-moss";
                  let bgColor = "bg-surface border-moss/25";
                  let statusLabel = "Settled";

                  if (!isSettled) {
                    if (isOwner) {
                      if (net > 0) {
                        statusColor = "text-gold";
                        bgColor = "bg-gold/10 border-gold/30";
                        statusLabel = `Owed ${formatPrice(net, currency)}`;
                      } else {
                        statusColor = "text-ink-muted";
                        bgColor = "bg-surface border-ink-faint";
                        statusLabel = `Owe ${formatPrice(-net, currency)}`;
                      }
                    } else {
                      if (net < 0) {
                        statusColor = "text-gold";
                        bgColor = "bg-gold/10 border-gold/30";
                        statusLabel = `Owes you ${formatPrice(-net, currency)}`;
                      } else {
                        statusColor = "text-ink-muted";
                        bgColor = "bg-surface border-ink-faint";
                        statusLabel = `You owe ${formatPrice(net, currency)}`;
                      }
                    }
                  }

                  return (
                    <button
                      key={id}
                      onClick={() => setExpandedPerson(isExpanded ? null : id)}
                      className={`group border p-4 text-left transition-all duration-200 ${bgColor} hover:shadow-none`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-moss text-white flex items-center justify-center text-sm font-medium group-hover:scale-110 transition-transform">
                          {personInitial(id, friendMap)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-ink text-sm truncate">{personName(id, friendMap)}</p>
                          <p className={`text-xs mt-1 ${statusColor} font-medium`}>{statusLabel}</p>
                        </div>
                        <div className="flex-shrink-0 text-xl text-ink-muted group-hover:text-ink transition-colors">
                          {isExpanded ? "−" : "+"}
                        </div>
                      </div>

                      {/* Per-person expanded content */}
                      {isExpanded && (() => {
                        const rows = personItems(id);
                        const paidTotal = rows.reduce((s, r) => s + r.paid, 0);
                        const shareTotal = rows.reduce((s, r) => s + r.share, 0);
                        const personNet = balances.get(id) ?? 0;
                        return (
                          <div className="mt-4 pt-4 border-t border-current opacity-75 space-y-3">
                            {rows.length === 0 ? (
                              <p className="text-xs text-ink-muted">No split items.</p>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  {rows.map(({ it, share, paid }) => {
                                    const percentage = it.price > 0 ? (share / it.price) * 100 : 0;
                                    return (
                                      <div key={it.id} className="space-y-1">
                                        <div className="flex justify-between items-baseline">
                                          <span className="text-xs text-ink font-medium truncate flex-1">{it.title}</span>
                                          <span className="text-xs font-medium text-ink-muted whitespace-nowrap ml-2">{formatPrice(share, currency)}</span>
                                        </div>
                                        {share > 0 && it.price > 0 && (
                                          <div className="flex items-center gap-2">
                                            <ProgressBar value={share} max={it.price} />
                                            <span className="text-xs text-ink-muted whitespace-nowrap w-10 text-right">{percentage.toFixed(0)}%</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="text-xs text-ink-muted pt-2 border-t border-current/40">
                                  <div className="flex justify-between mb-1">
                                    <span>Paid:</span>
                                    <span className="font-medium text-ink">{formatPrice(paidTotal, currency)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Share:</span>
                                    <span className="font-medium text-ink">{formatPrice(shareTotal, currency)}</span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settle-up plan */}
            {transfers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-ink-muted">Settlement plan</h3>
                <div className="border border-ink-faint divide-y divide-ink-faint">
                  {transfers.map((t, i) => {
                    const fromPerson = personName(t.from, friendMap);
                    const toPerson = personName(t.to, friendMap);
                    const fromInitial = personInitial(t.from, friendMap);
                    const toInitial = personInitial(t.to, friendMap);
                    return (
                      <div key={i} className="p-4 hover:bg-panel transition-colors">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-moss text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                              {fromInitial}
                            </div>
                            <span className="text-sm text-ink truncate">{fromPerson}</span>
                            <span className="text-moss font-medium flex-shrink-0">→</span>
                            <div className="w-6 h-6 rounded-full bg-moss text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                              {toInitial}
                            </div>
                            <span className="text-sm text-ink truncate">{toPerson}</span>
                          </div>
                          <span className="text-sm font-medium text-gold whitespace-nowrap">{formatPrice(t.amount, currency)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
