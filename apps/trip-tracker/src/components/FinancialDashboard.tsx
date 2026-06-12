"use client";

import { useState } from "react";
import { formatPrice, aggregateCosts, calculateDailySpending, calculatePerPersonCost, calculateTotalCost, getDetailedCostsByCategory, getDetailedDailySpending } from "@/lib/utils";

type Booking = {
  id: string;
  name?: string;
  type: string;
  price: string | null;
  currency: string;
  startDate: string | null;
};

type Excursion = {
  id: string;
  name?: string;
  type: string;
  price: string | null;
  currency: string;
  date: string | null;
};

type TripData = {
  id: string;
  name: string;
  budget: string | null;
  bookings: Booking[];
  excursions: Excursion[];
  participants: Array<{ id: string }>;
};

export default function FinancialDashboard({
  trip,
  onRefresh,
}: {
  trip: TripData;
  onRefresh: () => void;
}) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(trip.budget || "");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const totalCost = calculateTotalCost(trip.bookings, trip.excursions);
  const budgetAmount = trip.budget ? parseFloat(trip.budget) : null;
  const remaining = budgetAmount !== null ? budgetAmount - totalCost : null;
  const participantCount = trip.participants.length;
  const perPersonCost = participantCount > 0 ? calculatePerPersonCost(totalCost, participantCount) : 0;

  const costsByCategory = aggregateCosts(trip.bookings, trip.excursions);
  const dailySpending = calculateDailySpending(trip.bookings, trip.excursions);
  const detailedByCategory = getDetailedCostsByCategory(trip.bookings, trip.excursions);
  const detailedByDate = getDetailedDailySpending(trip.bookings, trip.excursions);

  const currency = trip.bookings[0]?.currency || trip.excursions[0]?.currency || "USD";

  const handleSaveBudget = async () => {
    if (!budgetInput || budgetInput === trip.budget) {
      setIsEditingBudget(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: budgetInput ? parseFloat(budgetInput) : null }),
      });
      if (response.ok) {
        setIsEditingBudget(false);
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to save budget:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Sort categories by cost (descending)
  const sortedCategories = Object.entries(costsByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([type, cost]) => ({ type, cost }));

  // Get unique dates and sort them for timeline
  const allDates = Array.from(
    new Set([
      ...trip.bookings.flatMap((b) => (b.startDate ? [new Date(b.startDate).toISOString().split("T")[0]] : [])),
      ...trip.excursions.flatMap((e) => (e.date ? [new Date(e.date).toISOString().split("T")[0]] : [])),
    ])
  ).sort();

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Actual Cost */}
        <div className="border border-ink-faint rounded-lg p-4 bg-panel">
          <p className="text-xs text-ink-muted mb-2">Actual Cost</p>
          <p className="text-2xl font-medium text-ink">{formatPrice(totalCost, currency)}</p>
        </div>

        {/* Budget Card */}
        {budgetAmount !== null ? (
          <div className="border border-ink-faint rounded-lg p-4 bg-panel">
            <p className="text-xs text-ink-muted mb-2">Budget</p>
            <p className="text-2xl font-medium text-ink mb-2">{formatPrice(budgetAmount, currency)}</p>
            <div className="w-full bg-ink-faint rounded h-1.5">
              <div
                className="h-full rounded bg-moss"
                style={{
                  width: Math.min((totalCost / budgetAmount) * 100, 100) + "%",
                }}
              />
            </div>
            <p className="text-xs text-ink-muted mt-2">
              {totalCost > budgetAmount ? "Over by " : "Remaining: "}
              <span className={totalCost > budgetAmount ? "text-ink" : "text-ink"}>
                {formatPrice(Math.abs(remaining!), currency)}
              </span>
            </p>
          </div>
        ) : (
          <div className="border border-ink-faint rounded-lg p-4 bg-panel">
            <p className="text-xs text-ink-muted mb-2">Budget</p>
            {isEditingBudget ? (
              <div className="space-y-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-ink-faint rounded font-mono"
                  autoFocus
                />
                <button
                  onClick={handleSaveBudget}
                  disabled={isSaving}
                  className="w-full px-2 py-1 text-xs bg-moss text-white rounded hover:bg-moss-dark disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Set Budget"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingBudget(true)}
                className="text-sm text-moss hover:text-moss-dark font-medium"
              >
                Set Budget →
              </button>
            )}
          </div>
        )}

        {/* Per Person Cost */}
        <div className="border border-ink-faint rounded-lg p-4 bg-panel">
          <p className="text-xs text-ink-muted mb-2">Per Person</p>
          <p className="text-2xl font-medium text-ink">{formatPrice(perPersonCost, currency)}</p>
          <p className="text-xs text-ink-muted mt-2">÷ {participantCount} participants</p>
        </div>

        {/* Budget Status (if budget set) */}
        {budgetAmount !== null && (
          <div className="border border-ink-faint rounded-lg p-4 bg-panel">
            <p className="text-xs text-ink-muted mb-2">Status</p>
            <p className="text-2xl font-medium mb-2">
              {totalCost > budgetAmount ? (
                <span className="text-ink">Over</span>
              ) : (
                <span className="text-moss">On Track</span>
              )}
            </p>
            <p className="text-xs text-ink-muted">
              {((totalCost / budgetAmount) * 100).toFixed(0)}% of budget spent
            </p>
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      {sortedCategories.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-ink mb-4">Cost Breakdown</h3>
          <div className="space-y-2">
            {sortedCategories.map(({ type, cost }) => {
              const isExpanded = expandedCategory === type;
              const items = detailedByCategory[type] || [];
              return (
                <div key={type}>
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : type)}
                    className="w-full flex items-center justify-between border border-ink-faint rounded-lg p-3 bg-panel hover:border-ink-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-ink-muted">{isExpanded ? "−" : "+"}</span>
                      <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-gold rounded">
                        {type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-ink">{formatPrice(cost, currency)}</span>
                  </button>
                  {isExpanded && items.length > 0 && (
                    <div className="mt-2 ml-4 border-l-2 border-ink-faint pl-4 py-2 bg-panel rounded overflow-x-auto">
                      <table className="w-full text-sm table-fixed">
                        <colgroup>
                          <col className="w-1/2" />
                          <col className="w-1/4" />
                          <col className="w-1/4" />
                        </colgroup>
                        <thead>
                          <tr className="border-b border-ink-faint">
                            <th className="text-left py-2 font-medium text-ink-muted text-xs">Item</th>
                            <th className="text-left py-2 font-medium text-ink-muted text-xs">Date</th>
                            <th className="text-right py-2 font-medium text-ink-muted text-xs">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.id} className="border-b border-ink-faint hover:bg-ink-faint/30">
                              <td className="py-2 text-ink break-words">{item.name}</td>
                              <td className="py-2 text-ink-muted text-xs whitespace-nowrap">
                                {item.date === "—" ? "—" : new Date(item.date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </td>
                              <td className="py-2 text-right text-ink font-medium whitespace-nowrap">{formatPrice(item.price, currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Spending Timeline */}
      {allDates.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-ink mb-4">Daily Spending</h3>
          <div className="space-y-2">
            {allDates.map((date) => {
              const dailyCost = dailySpending[date] || 0;
              const isExpanded = expandedDate === date;
              const items = detailedByDate[date] || [];
              return (
                <div key={date}>
                  <button
                    onClick={() => setExpandedDate(isExpanded ? null : date)}
                    className="w-full flex items-center justify-between border border-ink-faint rounded-lg p-3 bg-panel hover:border-ink-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-ink-muted">{isExpanded ? "−" : "+"}</span>
                      <span className="text-sm text-ink-muted">{new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}</span>
                    </div>
                    <span className="text-sm font-medium text-ink">{formatPrice(dailyCost, currency)}</span>
                  </button>
                  {isExpanded && items.length > 0 && (
                    <div className="mt-2 ml-4 border-l-2 border-ink-faint pl-4 py-2 bg-panel rounded overflow-x-auto">
                      <table className="w-full text-sm table-fixed">
                        <colgroup>
                          <col className="w-1/2" />
                          <col className="w-1/4" />
                          <col className="w-1/4" />
                        </colgroup>
                        <thead>
                          <tr className="border-b border-ink-faint">
                            <th className="text-left py-2 font-medium text-ink-muted text-xs">Item</th>
                            <th className="text-left py-2 font-medium text-ink-muted text-xs">Category</th>
                            <th className="text-right py-2 font-medium text-ink-muted text-xs">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.id} className="border-b border-ink-faint hover:bg-ink-faint/30">
                              <td className="py-2 text-ink break-words">{item.name}</td>
                              <td className="py-2 text-ink-muted text-xs">
                                <span className="inline-block px-2 py-0.5 bg-gold/20 text-gold rounded text-xs whitespace-nowrap">
                                  {item.type.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="py-2 text-right text-ink font-medium whitespace-nowrap">{formatPrice(item.price, currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedCategories.length === 0 && allDates.length === 0 && (
        <div className="border border-ink-faint rounded-lg p-8 text-center bg-panel">
          <p className="text-ink-muted text-sm">No costs recorded yet. Add bookings or excursions to see financial details.</p>
        </div>
      )}
    </div>
  );
}
