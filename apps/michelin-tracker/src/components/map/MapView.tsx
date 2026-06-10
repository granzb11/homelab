"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Restaurant } from "@prisma/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix broken default icon paths caused by webpack/Next.js
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

const STAR_COLORS: Record<number, string> = {
  1: "#EAB308",
  2: "#F97316",
  3: "#DC2626",
};

function makeIcon(stars: number) {
  const color = STAR_COLORS[stars] ?? "#6B7280";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <ellipse cx="14" cy="33" rx="5" ry="2.5" fill="rgba(0,0,0,0.2)"/>
    <path d="M14 0 C7 0 2 6 2 13 C2 22 14 36 14 36 C14 36 26 22 26 13 C26 6 21 0 14 0Z" fill="${color}"/>
    <text x="14" y="17" font-size="11" text-anchor="middle" fill="white" font-family="serif">★</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

interface Props {
  restaurants: Restaurant[];
}

export default function MapView({ restaurants }: Props) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const withCoords = restaurants.filter(
    (r) => r.latitude != null && r.longitude != null
  );

  const center: [number, number] =
    withCoords.length > 0
      ? [withCoords[0].latitude!, withCoords[0].longitude!]
      : [20, 0];

  return (
    <MapContainer
      center={center}
      zoom={withCoords.length > 0 ? 5 : 2}
      style={{ height: "600px", width: "100%" }}
      className="rounded-xl border border-gray-200 shadow-sm"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withCoords.map((r) => (
        <Marker
          key={r.id}
          position={[r.latitude!, r.longitude!]}
          icon={makeIcon(r.stars)}
        >
          <Popup>
            <div className="text-sm min-w-[160px]">
              <p className="font-semibold">{r.name}</p>
              <p className="text-gray-500">
                {r.city}, {r.country}
              </p>
              <p>
                <span
                  className={
                    r.stars === 3
                      ? "text-red-600"
                      : r.stars === 2
                        ? "text-orange-500"
                        : "text-yellow-500"
                  }
                >
                  {"★".repeat(r.stars)}
                </span>{" "}
                · Rating: {r.rating.toFixed(1)}
              </p>
              <p className="text-gray-500">{r.cuisine}</p>
              {r.photoLink && (
                <a
                  href={r.photoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-xs"
                >
                  Photos ↗
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
