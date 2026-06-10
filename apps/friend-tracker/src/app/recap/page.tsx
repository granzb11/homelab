import { prisma } from "@/lib/prisma";
import { computeStreak, haversineDistance } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface StatCard {
  label: string;
  value: string;
  sub: string;
  accent: "moss" | "gold";
}

export default async function RecapPage() {
  const year = 2026;
  const [friends, events] = await Promise.all([
    prisma.friend.findMany({
      include: {
        events: {
          where: { startDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } },
        },
      },
    }),
    prisma.event.findMany({
      where: { startDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } },
      include: { friends: { select: { id: true, name: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const total = events.length;
  if (total === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-xl font-medium text-ink mb-3">No hangouts logged yet.</p>
        <Link href="/hangouts/new" className="text-moss hover:text-moss-dark underline text-sm">
          Log your first →
        </Link>
      </div>
    );
  }

  const countByFriend = new Map<string, { name: string; count: number }>();
  for (const ev of events) {
    for (const f of ev.friends) {
      const e = countByFriend.get(f.id);
      if (e) e.count++; else countByFriend.set(f.id, { name: f.name, count: 1 });
    }
  }
  const mostSeen = [...countByFriend.values()].sort((a, b) => b.count - a.count)[0];

  const countByMonth = Array(12).fill(0);
  for (const ev of events) countByMonth[new Date(ev.startDate).getMonth()]++;
  const peakMonthIdx = countByMonth.indexOf(Math.max(...countByMonth));

  const allDates = friends.flatMap((f) => f.events.map((e) => e.startDate));
  const streak = computeStreak(allDates);

  const withCoords = events.filter((e) => e.lat != null && e.lng != null);
  let furthest: { location: string; dist: number; friendName: string } | null = null;
  if (withCoords.length >= 2) {
    const avgLat = withCoords.reduce((s, e) => s + e.lat!, 0) / withCoords.length;
    const avgLng = withCoords.reduce((s, e) => s + e.lng!, 0) / withCoords.length;
    let maxDist = 0;
    for (const e of withCoords) {
      const d = haversineDistance(avgLat, avgLng, e.lat!, e.lng!);
      if (d > maxDist) {
        maxDist = d;
        furthest = { location: e.location ?? "", dist: Math.round(d), friendName: e.friends.map((f) => f.name).join(", ") };
      }
    }
  }

  const cities = new Set(events.map((e) => e.location).filter(Boolean));

  const cards: StatCard[] = [
    ...(mostSeen ? [{
      label: "Most seen friend",
      value: mostSeen.name,
      sub: `${mostSeen.count} event${mostSeen.count !== 1 ? "s" : ""} in ${year}`,
      accent: "moss" as const,
    }] : []),
    {
      label: "Total events",
      value: String(total),
      sub: `across ${countByFriend.size} friend${countByFriend.size !== 1 ? "s" : ""}`,
      accent: "gold",
    },
    {
      label: "Most active month",
      value: MONTHS[peakMonthIdx],
      sub: `${countByMonth[peakMonthIdx]} event${countByMonth[peakMonthIdx] !== 1 ? "s" : ""}`,
      accent: "gold",
    },
    ...(streak > 0
      ? [{ label: "Current streak", value: `${streak} weeks`, sub: "consecutive weeks with a hangout", accent: "moss" as const }]
      : []),
    ...(furthest
      ? [{ label: "Furthest adventure", value: furthest.location, sub: `${furthest.dist.toLocaleString()} mi out · with ${furthest.friendName}`, accent: "gold" as const }]
      : []),
    ...(cities.size > 0
      ? [{ label: "Cities visited", value: String(cities.size), sub: [...cities].slice(0, 4).join(", "), accent: "moss" as const }]
      : []),
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="text-5xl font-display font-bold text-ink leading-none mb-2">{year}</h1>
        <p className="text-ink-muted text-sm">Your year of friendship, by the numbers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white border border-ink-faint rounded-2xl p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: c.accent === "moss" ? "oklch(0.35 0.11 140)" : "oklch(0.65 0.15 60)" }}
              />
              <p className="text-xs text-ink-muted">{c.label}</p>
            </div>
            <p className="font-display font-bold text-ink leading-tight line-clamp-2" style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}>
              {c.value}
            </p>
            <p className="text-xs text-ink-muted">{c.sub}</p>
          </div>
        ))}
      </div>

      <p className="text-center mt-10 text-xs text-ink-muted">
        <Link href="/" className="hover:text-moss">← Back to dashboard</Link>
      </p>
    </div>
  );
}
