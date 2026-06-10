import { prisma } from "@/lib/prisma";
import { daysSince, formatDate } from "@/lib/utils";
import { HangoutTimeline } from "@/components/HangoutTimeline";
import { AvatarUpload } from "@/components/AvatarUpload";
import { RelationshipSection } from "@/components/RelationshipSection";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FriendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [friend, allFriends] = await Promise.all([
    prisma.friend.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { startDate: "desc" },
          include: { friends: { select: { id: true, name: true } } },
        },
        reminders: true,
        relationshipsAs: { include: { friendB: true } },
        relationshipsAs2: { include: { friendA: true } },
      },
    }),
    prisma.friend.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, avatarUrl: true } }),
  ]);

  if (!friend) notFound();

  const lastDate = friend.events[0]?.startDate ?? null;
  const days = daysSince(lastDate);

  const relationships = [
    ...friend.relationshipsAs.map((r) => ({ id: r.id, type: r.type, friend: { id: r.friendB.id, name: r.friendB.name, avatarUrl: r.friendB.avatarUrl } })),
    ...friend.relationshipsAs2.map((r) => ({ id: r.id, type: r.type, friend: { id: r.friendA.id, name: r.friendA.name, avatarUrl: r.friendA.avatarUrl } })),
  ];

  const otherFriends = allFriends.filter((f) => f.id !== id);

  const timelineEvents = friend.events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    startDate: ev.startDate.toISOString(),
    endDate: ev.endDate?.toISOString() ?? null,
    eventType: ev.eventType,
    location: ev.location,
    city: ev.city,
    whoTraveled: ev.whoTraveled,
    notes: ev.notes,
    friends: ev.friends,
  }));

  return (
    <div className="max-w-2xl">
      <Link href="/friends" className="text-sm text-ink-muted hover:text-ink mb-6 inline-block">
        ← Friends
      </Link>

      <div className="flex items-start justify-between mb-8 mt-2">
        <div className="flex items-start gap-4">
          <AvatarUpload friendId={friend.id} name={friend.name} avatarUrl={friend.avatarUrl ?? null} size="lg" />
          <div>
            <h1 className="text-3xl font-display font-semibold text-ink">{friend.name}</h1>
            {friend.notes && (
              <p className="text-sm text-ink-muted mt-1">{friend.notes}</p>
            )}
            <p className="text-sm text-ink-muted mt-1">
              {lastDate
                ? `Last seen ${formatDate(lastDate)} (${days}d ago)`
                : "Never hung out yet"}
            </p>
          </div>
        </div>
        <Link
          href={`/hangouts/new?friendId=${id}`}
          className="bg-moss text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-moss-dark flex-shrink-0"
        >
          Log hangout
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="text-xs font-medium text-ink-muted mb-4">
          Events ({friend.events.length})
        </h2>
        <HangoutTimeline events={timelineEvents} currentFriendId={id} />
      </section>

      <RelationshipSection
        friendId={id}
        relationships={relationships}
        allFriends={otherFriends}
      />

      {friend.reminders.length > 0 && (
        <section className="border-t border-ink-faint pt-6">
          <h2 className="text-xs font-medium text-ink-muted mb-3">Reminders</h2>
          <ul className="space-y-2">
            {friend.reminders.map((r) => (
              <li key={r.id} className="text-sm text-ink bg-panel border border-ink-faint rounded-lg px-4 py-2.5">
                Alert if no event in {r.thresholdDays} days
              </li>
            ))}
          </ul>
          <Link href="/reminders" className="text-xs text-moss hover:text-moss-dark mt-2 inline-block">
            Manage reminders →
          </Link>
        </section>
      )}
    </div>
  );
}
