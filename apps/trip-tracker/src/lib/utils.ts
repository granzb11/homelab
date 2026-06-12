export function formatDate(date: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateRange(start?: Date | string | null, end?: Date | string | null): string {
  if (!start && !end) return "Dates TBD";
  if (!start) return formatDate(end);
  if (!end) return formatDate(start);
  const s = new Date(start);
  const e = new Date(end);
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

type BookingData = { type: string; price: string | number | null };
type ExcursionData = { type: string; price: string | number | null };

export function aggregateCosts(bookings: BookingData[], excursions: ExcursionData[]) {
  const costs: { [key: string]: number } = {};

  bookings.forEach((b) => {
    if (b.price === null || b.price === undefined) return;
    const price = typeof b.price === "object" ? parseFloat(String(b.price)) : Number(b.price);
    if (isNaN(price)) return;
    costs[b.type] = (costs[b.type] || 0) + price;
  });

  excursions.forEach((e) => {
    if (e.price === null || e.price === undefined) return;
    const price = typeof e.price === "object" ? parseFloat(String(e.price)) : Number(e.price);
    if (isNaN(price)) return;
    costs[e.type] = (costs[e.type] || 0) + price;
  });

  return costs;
}

type ItemWithDate = { date?: Date | string | null; price: string | number | null };

export type DetailedItem = {
  id: string;
  name: string;
  type: string;
  price: number;
  date: string;
};

export function calculateDailySpending(
  bookings: (BookingData & { startDate?: Date | string | null })[],
  excursions: (ExcursionData & { date?: Date | string | null })[],
  tripStartDate?: Date | string | null
) {
  const dailySpending: { [dateKey: string]: number } = {};

  bookings.forEach((b) => {
    if (!b.startDate) return;
    const date = new Date(b.startDate);
    if (!b.price) return;
    const price = typeof b.price === "object" ? parseFloat(String(b.price)) : Number(b.price);
    if (isNaN(price)) return;
    const key = date.toISOString().split("T")[0];
    dailySpending[key] = (dailySpending[key] || 0) + price;
  });

  excursions.forEach((e) => {
    if (!e.date) return;
    const date = new Date(e.date);
    if (!e.price) return;
    const price = typeof e.price === "object" ? parseFloat(String(e.price)) : Number(e.price);
    if (isNaN(price)) return;
    const key = date.toISOString().split("T")[0];
    dailySpending[key] = (dailySpending[key] || 0) + price;
  });

  return dailySpending;
}

export function getDetailedCostsByCategory(
  bookings: (BookingData & { id: string; name?: string; startDate?: Date | string | null })[],
  excursions: (ExcursionData & { id: string; name?: string; date?: Date | string | null })[]
): { [category: string]: DetailedItem[] } {
  const categorizedItems: { [category: string]: DetailedItem[] } = {};

  bookings.forEach((b) => {
    if (b.price === null || b.price === undefined) return;
    const price = typeof b.price === "object" ? parseFloat(String(b.price)) : Number(b.price);
    if (isNaN(price)) return;
    if (!categorizedItems[b.type]) categorizedItems[b.type] = [];
    categorizedItems[b.type].push({
      id: b.id,
      name: (b as any).title || b.name || "Unnamed Booking",
      type: b.type,
      price,
      date: b.startDate ? new Date(b.startDate).toISOString().split("T")[0] : "—",
    });
  });

  excursions.forEach((e) => {
    if (e.price === null || e.price === undefined) return;
    const price = typeof e.price === "object" ? parseFloat(String(e.price)) : Number(e.price);
    if (isNaN(price)) return;
    if (!categorizedItems[e.type]) categorizedItems[e.type] = [];
    categorizedItems[e.type].push({
      id: e.id,
      name: (e as any).title || e.name || "Unnamed Excursion",
      type: e.type,
      price,
      date: e.date ? new Date(e.date).toISOString().split("T")[0] : "—",
    });
  });

  // Sort items within each category by date
  Object.values(categorizedItems).forEach((items) => {
    items.sort((a, b) => a.date.localeCompare(b.date));
  });

  return categorizedItems;
}

export function getDetailedDailySpending(
  bookings: (BookingData & { id: string; name?: string; startDate?: Date | string | null })[],
  excursions: (ExcursionData & { id: string; name?: string; date?: Date | string | null })[]
): { [dateKey: string]: DetailedItem[] } {
  const dailyItems: { [dateKey: string]: DetailedItem[] } = {};

  bookings.forEach((b) => {
    if (!b.startDate || b.price === null || b.price === undefined) return;
    const price = typeof b.price === "object" ? parseFloat(String(b.price)) : Number(b.price);
    if (isNaN(price)) return;
    const key = new Date(b.startDate).toISOString().split("T")[0];
    if (!dailyItems[key]) dailyItems[key] = [];
    dailyItems[key].push({
      id: b.id,
      name: (b as any).title || b.name || "Unnamed Booking",
      type: b.type,
      price,
      date: key,
    });
  });

  excursions.forEach((e) => {
    if (!e.date || e.price === null || e.price === undefined) return;
    const price = typeof e.price === "object" ? parseFloat(String(e.price)) : Number(e.price);
    if (isNaN(price)) return;
    const key = new Date(e.date).toISOString().split("T")[0];
    if (!dailyItems[key]) dailyItems[key] = [];
    dailyItems[key].push({
      id: e.id,
      name: (e as any).title || e.name || "Unnamed Excursion",
      type: e.type,
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

export function calculateTotalCost(bookings: BookingData[], excursions: ExcursionData[]): number {
  let total = 0;

  bookings.forEach((b) => {
    if (b.price === null || b.price === undefined) return;
    const price = typeof b.price === "object" ? parseFloat(String(b.price)) : Number(b.price);
    if (!isNaN(price)) total += price;
  });

  excursions.forEach((e) => {
    if (e.price === null || e.price === undefined) return;
    const price = typeof e.price === "object" ? parseFloat(String(e.price)) : Number(e.price);
    if (!isNaN(price)) total += price;
  });

  return total;
}
