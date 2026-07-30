export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateRange, tripDurationDays } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-gold-tint text-gold",
  ACTIVE: "bg-moss-tint text-moss",
  COMPLETED: "bg-panel text-ink-muted",
};

export default async function HomePage() {
  const trips = await prisma.trip.findMany({
    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { events: true, participants: true } },
      todos: { where: { bookedAt: null } },
    },
  });

  const upcoming = trips.filter(
    (t) => t.status === "PLANNING" || t.status === "ACTIVE"
  );
  const past = trips.filter((t) => t.status === "COMPLETED");

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink leading-tight">
            Your trips
          </h1>
          <p className="text-ink-muted text-sm mt-1">{trips.length} trip{trips.length !== 1 ? "s" : ""} tracked</p>
        </div>
        <Link
          href="/trips/new"
          className="bg-moss text-white text-sm px-4 py-2 hover:bg-moss-dark"
        >
          + New trip
        </Link>
      </div>

      {trips.length === 0 && (
        <div className="border border-ink-faint p-12 text-center">
          <p className="font-display text-2xl text-ink-muted mb-2">No trips yet</p>
          <p className="text-sm text-ink-muted mb-6">Start planning your next adventure.</p>
          <Link href="/trips/new" className="bg-moss text-white text-sm px-5 py-2.5 hover:bg-moss-dark">
            Plan a trip
          </Link>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium tracking-widest text-ink-muted uppercase">Upcoming</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium tracking-widest text-ink-muted uppercase">Past trips</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {past.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TripCard({ trip }: {
  trip: {
    id: string;
    name: string;
    destination: string | null;
    startDate: Date | null;
    endDate: Date | null;
    status: string;
    _count: { events: number; participants: number };
    todos: { id: string }[];
  };
}) {
  const duration = tripDurationDays(trip.startDate, trip.endDate);
  const pendingTodos = trip.todos.length;

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="block bg-panel border border-ink-faint p-5 hover:border-moss group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold text-ink group-hover:text-moss truncate leading-tight">
            {trip.name}
          </h3>
          {trip.destination && (
            <p className="text-sm text-ink-muted mt-0.5 truncate">{trip.destination}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 flex-shrink-0 ${STATUS_COLORS[trip.status] ?? "bg-panel text-ink-muted"}`}>
          {STATUS_LABEL[trip.status] ?? trip.status}
        </span>
      </div>

      <p className="text-sm text-ink-muted mb-4">
        {formatDateRange(trip.startDate, trip.endDate)}
        {duration && <span className="ml-2 text-ink-faint">· {duration}d</span>}
      </p>

      <div className="flex items-center gap-4 text-xs text-ink-muted">
        <span>{trip._count.events} event{trip._count.events !== 1 ? "s" : ""}</span>
        <span>{trip._count.participants} traveller{trip._count.participants !== 1 ? "s" : ""}</span>
        {pendingTodos > 0 && (
          <span className="ml-auto text-gold font-medium">{pendingTodos} to book</span>
        )}
      </div>
    </Link>
  );
}
