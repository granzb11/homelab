"use client";

import dynamic from "next/dynamic";
import type { Restaurant } from "@prisma/client";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-100 animate-pulse rounded-xl border border-gray-200 flex items-center justify-center text-gray-400">
      Loading map…
    </div>
  ),
});

export function MapWrapper({ restaurants }: { restaurants: Restaurant[] }) {
  return <MapView restaurants={restaurants} />;
}
