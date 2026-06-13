function toSafeDate(date: Date | string): Date {
  if (date instanceof Date) return date;
  // Dates stored as UTC midnight (plain YYYY-MM-DD or ISO T00:00:00Z) shift to
  // the previous day in western timezones. Anchor to noon UTC to prevent that.
  const key = date.slice(0, 10); // "YYYY-MM-DD"
  return new Date(key + "T12:00:00Z");
}

export function formatDate(date: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return "—";
  return toSafeDate(date).toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateRange(start?: Date | string | null, end?: Date | string | null): string {
  if (!start && !end) return "Dates TBD";
  if (!start) return formatDate(end);
  if (!end) return formatDate(start);
  const s = toSafeDate(start);
  const e = toSafeDate(end);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatPrice(price: unknown, currency: string): string {
  if (price === null || price === undefined) return "";
  const num = typeof price === "object" ? parseFloat(String(price)) : Number(price);
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(num);
}

export function tripDurationDays(start?: Date | string | null, end?: Date | string | null): number | null {
  if (!start || !end) return null;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

type ReservationData = { type: string; price: string | number | null };

export function aggregateCosts(reservations: ReservationData[]) {
  const costs: { [key: string]: number } = {};

  reservations.forEach((r) => {
    if (r.price === null || r.price === undefined) return;
    const price = typeof r.price === "object" ? parseFloat(String(r.price)) : Number(r.price);
    if (isNaN(price)) return;
    costs[r.type] = (costs[r.type] || 0) + price;
  });

  return costs;
}

export type DetailedItem = {
  id: string;
  name: string;
  type: string;
  price: number;
  date: string;
};

export function calculateDailySpending(
  reservations: (ReservationData & { startDate?: Date | string | null })[],
  tripStartDate?: Date | string | null
) {
  const dailySpending: { [dateKey: string]: number } = {};

  reservations.forEach((r) => {
    if (!r.startDate) return;
    const date = new Date(r.startDate);
    if (!r.price) return;
    const price = typeof r.price === "object" ? parseFloat(String(r.price)) : Number(r.price);
    if (isNaN(price)) return;
    const key = date.toISOString().split("T")[0];
    dailySpending[key] = (dailySpending[key] || 0) + price;
  });

  return dailySpending;
}

export function getDetailedCostsByCategory(
  reservations: (ReservationData & { id: string; title?: string; startDate?: Date | string | null })[]
): { [category: string]: DetailedItem[] } {
  const categorizedItems: { [category: string]: DetailedItem[] } = {};

  reservations.forEach((r) => {
    if (r.price === null || r.price === undefined) return;
    const price = typeof r.price === "object" ? parseFloat(String(r.price)) : Number(r.price);
    if (isNaN(price)) return;
    if (!categorizedItems[r.type]) categorizedItems[r.type] = [];
    categorizedItems[r.type].push({
      id: r.id,
      name: (r as any).title || "Unnamed Reservation",
      type: r.type,
      price,
      date: r.startDate ? new Date(r.startDate).toISOString().split("T")[0] : "—",
    });
  });

  // Sort items within each category by date
  Object.values(categorizedItems).forEach((items) => {
    items.sort((a, b) => a.date.localeCompare(b.date));
  });

  return categorizedItems;
}

export function getDetailedDailySpending(
  reservations: (ReservationData & { id: string; title?: string; startDate?: Date | string | null })[]
): { [dateKey: string]: DetailedItem[] } {
  const dailyItems: { [dateKey: string]: DetailedItem[] } = {};

  reservations.forEach((r) => {
    if (!r.startDate || r.price === null || r.price === undefined) return;
    const price = typeof r.price === "object" ? parseFloat(String(r.price)) : Number(r.price);
    if (isNaN(price)) return;
    const key = new Date(r.startDate).toISOString().split("T")[0];
    if (!dailyItems[key]) dailyItems[key] = [];
    dailyItems[key].push({
      id: r.id,
      name: (r as any).title || "Unnamed Reservation",
      type: r.type,
      price,
      date: key,
    });
  });

  // Sort items within each day by type
  Object.values(dailyItems).forEach((items) => {
    items.sort((a, b) => a.type.localeCompare(b.type));
  });

  return dailyItems;
}

export function calculatePerPersonCost(totalCost: number, participantCount: number): number {
  if (participantCount === 0) return 0;
  return totalCost / participantCount;
}

export function calculateTotalCost(reservations: ReservationData[]): number {
  let total = 0;

  reservations.forEach((r) => {
    if (r.price === null || r.price === undefined) return;
    const price = typeof r.price === "object" ? parseFloat(String(r.price)) : Number(r.price);
    if (!isNaN(price)) total += price;
  });

  return total;
}
