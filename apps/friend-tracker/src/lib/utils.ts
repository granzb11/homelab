export function daysSince(date: Date | null | undefined): number | null {
  if (!date) return null;
  const ms = Date.now() - new Date(date).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function computeStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const weekOf = (d: Date) => Math.floor((now - d.getTime()) / msPerWeek);
  const weeks = new Set(dates.map((d) => weekOf(new Date(d))));
  if (!weeks.has(0) && !weeks.has(1)) return 0;
  let streak = 0;
  let expected = weeks.has(0) ? 0 : 1;
  while (weeks.has(expected)) { streak++; expected++; }
  return streak;
}

export function extractNextPlan(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Next:\s*(.+)$/);
  return match ? match[1].trim() : null;
}

export function getWeeklyData(dates: Date[], weeks = 8): number[] {
  const now = Date.now();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const data = Array(weeks).fill(0);
  for (const d of dates) {
    const weeksAgo = Math.floor((now - new Date(d).getTime()) / msPerWeek);
    if (weeksAgo >= 0 && weeksAgo < weeks) data[weeks - 1 - weeksAgo]++;
  }
  return data;
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
