import { getPrisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const prisma = getPrisma();
  const [
    total,
    starGroups,
    ratingAgg,
    pairingAgg,
    wouldReturn,
    pairingTypeGroups,
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
    prisma.restaurant.groupBy({
      by: ["pairingType"],
      _count: { _all: true },
    }),
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

  return Response.json({
    total,
    byStars,
    avgRating: ratingAgg._avg.rating ?? 0,
    avgPairingPrice: pairingAgg._avg.pairingPrice ?? 0,
    totalPairingSpend: pairingAgg._sum.pairingPrice ?? 0,
    wouldReturn,
    byPairing,
  });
}
