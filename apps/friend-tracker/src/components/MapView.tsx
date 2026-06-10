"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { formatDate } from "@/lib/utils";

export interface HangoutPoint {
  id: string;
  friendName: string;
  color: string;
  date: string;
  location: string;
  notes: string | null;
  lat: number;
  lng: number;
}

export default function MapView({ hangouts }: { hangouts: HangoutPoint[] }) {
  if (hangouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No hangout locations yet — add a location when logging a hangout.
      </div>
    );
  }

  const center: [number, number] = [
    hangouts.reduce((s, h) => s + h.lat, 0) / hangouts.length,
    hangouts.reduce((s, h) => s + h.lng, 0) / hangouts.length,
  ];

  return (
    <MapContainer center={center} zoom={4} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {hangouts.map((h) => (
        <CircleMarker
          key={h.id}
          center={[h.lat, h.lng]}
          radius={12}
          pathOptions={{ color: h.color, fillColor: h.color, fillOpacity: 0.75, weight: 2 }}
        >
          <Popup>
            <div className="text-sm space-y-0.5">
              <p className="font-semibold">{h.friendName}</p>
              <p className="text-gray-500">{formatDate(h.date)}</p>
              <p className="text-gray-700">{h.location}</p>
              {h.notes && <p className="text-gray-400 text-xs mt-1">{h.notes.split(".")[0]}</p>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
