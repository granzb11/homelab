import { getPrisma } from "@/lib/db";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { RestaurantTimeline } from "@/components/dashboard/RestaurantTimeline";

export const dynamic = "force-dynamic";

async function getData() {
  const prisma = getPrisma();
  const [
    total,
    starGroups,
    ratingAgg,
    pairingAgg,
    wouldReturn,
    pairingTypeGroups,
    restaurants,
  ] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.groupBy({ by: ["stars"], _count: { _all: true } }),
    prisma.restaurant.aggregate({ _avg: { rating: true } }),
    prisma.restaurant.aggregate({
      _avg: { pairingPrice: true },
      _sum: { pairingPrice: true },
      where: { pairingPrice: { not: null } },
    }),
    prisma.restaurant.count({ where: { goBack: true } }),
    prisma.restaurant.groupBy({ by: ["pairingType"], _count: { _all: true } }),
    prisma.restaurant.findMany({ orderBy: { dateVisited: "asc" } }),
  ]);

  const byStars: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  for (const g of starGroups) byStars[g.stars] = g._count._all;

  const byPairing: Record<string, number> = {
    WINE_PAIRING: 0,
    RESERVED_WINE_PAIRING: 0,
    BEVERAGE_PAIRING: 0,
    NONE: 0,
  };
  for (const g of pairingTypeGroups) byPairing[g.pairingType] = g._count._all;

  return {
    stats: {
      total,
      byStars,
      avgRating: ratingAgg._avg.rating ?? 0,
      avgPairingPrice: pairingAgg._avg.pairingPrice ?? 0,
      totalPairingSpend: pairingAgg._sum.pairingPrice ?? 0,
      wouldReturn,
      byPairing,
    },
    restaurants,
  };
}

export default async function DashboardPage() {
  const { stats, restaurants } = await getData();
  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-fraunces)",
          fontWeight: 600,
          fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          color: "var(--color-ink)",
          marginBottom: "0.35rem",
        }}
      >
        Dashboard
      </h1>
      <p style={{ color: "var(--color-muted)", fontSize: "0.8125rem", marginBottom: "2rem" }}>
        Your Michelin journey at a glance
      </p>

      <DashboardGrid stats={stats} />

      <div style={{ marginTop: "3rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-fraunces)",
            fontWeight: 600,
            fontSize: "1.25rem",
            letterSpacing: "-0.02em",
            color: "var(--color-ink)",
            marginBottom: "0.25rem",
          }}
        >
          Your journey
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginBottom: "1.25rem" }}>
          {restaurants.length} {restaurants.length === 1 ? "visit" : "visits"} across{" "}
          {new Set(restaurants.map((r) => r.country)).size} countries
        </p>
        <RestaurantTimeline restaurants={restaurants} />
      </div>
    </div>
  );
}
