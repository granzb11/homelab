import { prisma } from "@/lib/prisma";
import RestaurantsClient, { type Restaurant } from "@/components/RestaurantsClient";

export const dynamic = "force-dynamic";

export default async function RestaurantsPage() {
  const rows = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
  });
  const restaurants: Restaurant[] = rows.map((r) => ({
    ...r,
    visitedAt: r.visitedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
  return <RestaurantsClient initialRestaurants={restaurants} />;
}
