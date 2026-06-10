import { prisma } from "@/lib/prisma";
import { MapClient } from "@/components/MapClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FRIEND_COLORS = [
  "#3a6639", "#b07d1a", "#7a4a2d", "#5a7a60", "#8b4a3e", "#3a5f6a",
];

export default async function MapPage() {
  const events = await prisma.event.findMany({
    where: { lat: { not: null } },
    include: { friends: { select: { id: true, name: true } } },
    orderBy: { startDate: "desc" },
  });

  const allFriendIds = [...new Set(events.flatMap((e) => e.friends.map((f) => f.id)))];
  const colorMap = new Map(allFriendIds.map((id, i) => [id, FRIEND_COLORS[i % FRIEND_COLORS.length]]));

  const points = events.map((ev) => ({
    id: ev.id,
    friendName: ev.friends.map((f) => f.name).join(", "),
    color: ev.friends[0] ? (colorMap.get(ev.friends[0].id) ?? "#3a6639") : "#3a6639",
    date: ev.startDate.toISOString(),
    location: ev.location ?? "",
    notes: ev.notes,
    lat: ev.lat!,
    lng: ev.lng!,
  }));

  const legend = allFriendIds.map((id) => {
    const friend = events.flatMap((e) => e.friends).find((f) => f.id === id);
    return { name: friend?.name ?? id, color: colorMap.get(id)! };
  });

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 3.5rem - 2rem)" }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-display font-semibold text-ink">Hangout map</h1>
        <div className="flex items-center gap-5">
          <div className="flex gap-4 flex-wrap">
            {legend.map((l) => (
              <div key={l.name} className="flex items-center gap-1.5 text-xs text-ink-muted">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                {l.name}
              </div>
            ))}
          </div>
          <span className="text-xs text-ink-muted">{points.length} location{points.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-ink-faint" style={{ minHeight: 0 }}>
        <MapClient hangouts={points} />
      </div>

      {points.length === 0 && (
        <p className="mt-4 text-sm text-ink-muted text-center">
          Add a location when{" "}
          <Link href="/hangouts/new" className="text-moss hover:text-moss-dark underline">
            logging a hangout
          </Link>{" "}
          to see it here.
        </p>
      )}
    </div>
  );
}
