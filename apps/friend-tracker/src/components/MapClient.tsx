"use client";

import dynamic from "next/dynamic";
import type { HangoutPoint } from "./MapView";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export function MapClient({ hangouts }: { hangouts: HangoutPoint[] }) {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapView hangouts={hangouts} />
    </div>
  );
}
