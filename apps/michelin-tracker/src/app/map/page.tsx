import { getPrisma } from "@/lib/db";
import { MapWrapper } from "@/components/map/MapWrapper";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const prisma = getPrisma();
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { dateVisited: "desc" },
  });

  const withCoords = restaurants.filter((r) => r.latitude != null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Map</h1>
        <p className="text-sm text-gray-500">
          {withCoords.length} of {restaurants.length} restaurants geocoded
        </p>
      </div>
      <MapWrapper restaurants={restaurants} />
      {withCoords.length < restaurants.length && (
        <p className="text-xs text-gray-400 mt-2">
          Some restaurants are missing coordinates. Edit and re-save them to
          trigger geocoding.
        </p>
      )}
    </div>
  );
}
