export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fetchFriendMap } from "@/lib/friends";
import { formatDateRange, tripDurationDays } from "@/lib/utils";
import TripDetailClient from "@/components/TripDetailClient";
import DeleteTripButton from "@/components/DeleteTripButton";

type Ctx = { params: Promise<{ id: string }> };

export default async function TripDetailPage({ params }: Ctx) {
  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      events: {
        include: { participants: true, attachments: true },
        orderBy: { startDate: "asc" },
      },
      expenses: {
        include: { participants: true },
        orderBy: { date: "asc" },
      },
      participants: { orderBy: { createdAt: "asc" } },
      todos: { orderBy: { createdAt: "asc" } },
      cities: { orderBy: { targetStartDate: "asc" } },
      restaurants: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!trip) notFound();

  const friendMap = await fetchFriendMap();
  const duration = tripDurationDays(trip.startDate, trip.endDate);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 ${
              trip.status === "ACTIVE" ? "bg-moss-tint text-moss" :
              trip.status === "PLANNING" ? "bg-gold-tint text-gold" :
              "bg-panel text-ink-muted"
            }`}>
              {trip.status.charAt(0) + trip.status.slice(1).toLowerCase()}
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold text-ink leading-tight">{trip.name}</h1>
          {trip.destination && <p className="text-ink-muted mt-1">{trip.destination}</p>}
          <p className="text-sm text-ink-muted mt-1">
            {formatDateRange(trip.startDate, trip.endDate)}
            {duration && <span className="ml-2 text-ink-faint">· {duration} days</span>}
          </p>
          {trip.description && <p className="text-sm text-ink-muted mt-2 max-w-xl">{trip.description}</p>}
        </div>
        <DeleteTripButton tripId={trip.id} />
      </div>

      <TripDetailClient
        trip={JSON.parse(JSON.stringify(trip))}
        friendMap={Object.fromEntries(friendMap)}
      />
    </div>
  );
}
