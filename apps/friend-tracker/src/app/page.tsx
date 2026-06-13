import { prisma } from "@/lib/prisma";
import { daysSince, computeStreak, extractNextPlan, getWeeklyData } from "@/lib/utils";
import { ItsBeenModal } from "@/components/ItsBeenModal";
import { FriendHeatGrid } from "@/components/FriendHeatGrid";
import { StreakCards } from "@/components/StreakCards";
import { YearTimeline } from "@/components/YearTimeline";
import { NextPlanCards } from "@/components/NextPlanCards";
import { PlannedTrips } from "@/components/PlannedTrips";
import { RecentFeed } from "@/components/RecentFeed";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [friends, reminders, [allEvents, totalEvents], plannedTrips] = await Promise.all([
    prisma.friend.findMany({
      include: { events: { where: { status: "logged" }, orderBy: { startDate: "desc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.reminder.findMany({
      include: {
        friend: {
          include: { events: { where: { status: "logged" }, orderBy: { startDate: "desc" }, take: 1 } },
        },
      },
    }),
    Promise.all([
      prisma.event.findMany({
        where: { status: "logged" },
        include: { friends: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { startDate: "desc" },
        take: 20,
      }),
      prisma.event.count({ where: { status: "logged" } }),
    ]),
    prisma.event.findMany({
      where: { status: "planned" },
      include: { friends: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const alerts = reminders
    .map((r) => {
      const last = r.friend.events[0]?.startDate ?? null;
      const days = daysSince(last);
      return { id: r.id, friendName: r.friend.name, daysSinceSeen: days, thresholdDays: r.thresholdDays, friendId: r.friendId, isTriggered: days === null || days >= r.thresholdDays };
    })
    .filter((a) => a.isTriggered);

  const plans = friends
    .map((f) => {
      const plan = extractNextPlan(f.events[0]?.notes ?? null);
      if (!plan) return null;
      return { friendName: f.name, friendId: f.id, plan, daysSinceSeen: daysSince(f.events[0]?.startDate) };
    })
    .filter(Boolean) as Array<{ friendName: string; friendId: string; plan: string; daysSinceSeen: number | null }>;

const yearStart = new Date("2026-01-01");
  const yearEnd = new Date("2027-01-01");

  function eventDays(e: { startDate: Date; endDate: Date | null }): number {
    if (!e.endDate) return 1;
    return Math.max(1, Math.round((e.endDate.getTime() - e.startDate.getTime()) / 86400000) + 1);
  }

  function daysThisYear(f: typeof friends[0]): number {
    return f.events
      .filter((e) => e.startDate >= yearStart && e.startDate < yearEnd)
      .reduce((sum, e) => sum + eventDays(e), 0);
  }

  const friendsByDays = [...friends]
    .map((f) => ({ ...f, _daysThisYear: daysThisYear(f) }))
    .sort((a, b) => b._daysThisYear - a._daysThisYear);

  // Top 4 by days this year
  const top4ByDays = friendsByDays.slice(0, 4);

  // Top 4 most recently seen (excluding anyone already in top4ByDays)
  const top4ByDaysIds = new Set(top4ByDays.map((f) => f.id));
  const friendsByRecency = [...friends]
    .filter((f) => f.events.length > 0 && !top4ByDaysIds.has(f.id))
    .sort((a, b) => {
      const aDate = a.events[0]?.startDate?.getTime() ?? 0;
      const bDate = b.events[0]?.startDate?.getTime() ?? 0;
      return bDate - aDate;
    });
  const top4ByRecency = friendsByRecency.slice(0, 4);

  function recencyLabel(date: Date | null): string {
    if (!date) return "never";
    const diff = Math.round((Date.now() - date.getTime()) / 86400000);
    if (diff === 0) return "today";
    if (diff === 1) return "1d ago";
    if (diff < 7)   return `${diff}d ago`;
    if (diff < 30)  return `${Math.floor(diff / 7)}w ago`;
    return `${Math.floor(diff / 30)}mo ago`;
  }

  // Combined 8 friends for the heat grid
  const topFriends = friendsByDays.slice(0, 6); // kept for streak/weekly data
  const heatData = [
    ...top4ByDays.map((f) => ({
      id: f.id,
      name: f.name,
      avatarUrl: f.avatarUrl ?? null,
      daysSpent: f._daysThisYear,
    })),
    ...top4ByRecency.map((f) => ({
      id: f.id,
      name: f.name,
      avatarUrl: f.avatarUrl ?? null,
      daysSpent: daysThisYear(f),
      sublabel: recencyLabel(f.events[0]?.startDate ?? null),
    })),
  ];

  const streakData = topFriends.map((f) => ({
    id: f.id,
    name: f.name,
    avatarUrl: f.avatarUrl ?? null,
    streak: computeStreak(f.events.map((e) => e.startDate)),
    totalDays: f.events.reduce((sum, e) => sum + eventDays(e), 0),
    weeklyData: getWeeklyData(f.events.map((e) => e.startDate)),
  }));

  const hangoutDates = allEvents.map((e) => e.startDate.toISOString());

  const plannedCards = plannedTrips.map((t) => ({
    id: t.id,
    title: t.title,
    city: t.city,
    location: t.location,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate?.toISOString() ?? null,
    notes: t.notes,
    friends: t.friends,
  }));

  return (
    <div className="space-y-10">
      <ItsBeenModal alerts={alerts} />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-semibold text-ink">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/plans/new"
            className="border border-moss text-moss px-4 py-2 rounded-lg text-sm font-medium hover:bg-moss-tint"
          >
            Plan a trip
          </Link>
          <Link
            href="/hangouts/new"
            className="bg-moss text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-moss-dark"
          >
            Log hangout
          </Link>
        </div>
      </div>

      {plannedCards.length > 0 && (
        <section>
          <p className="text-xs font-medium text-ink-muted mb-3">Trips to plan</p>
          <PlannedTrips trips={plannedCards} />
        </section>
      )}

      {plans.length > 0 && (
        <section>
          <p className="text-xs font-medium text-ink-muted mb-3">Coming up</p>
          <NextPlanCards plans={plans} />
        </section>
      )}

      {friends.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-ink-muted">Most time</p>
              {top4ByRecency.length > 0 && (
                <>
                  <span className="text-ink-faint">·</span>
                  <p className="text-xs font-medium text-ink-muted">Recently seen</p>
                </>
              )}
            </div>
            <Link href="/friends" className="text-xs text-moss hover:text-moss-dark font-medium">
              View all {friends.length} →
            </Link>
          </div>
          <FriendHeatGrid friends={heatData} dividerAfter={top4ByRecency.length > 0 ? 4 : undefined} />
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white border border-ink-faint rounded-2xl p-5">
          <p className="text-xs font-medium text-ink-muted mb-4">Activity by friend</p>
          {friends.length > 0
            ? <StreakCards friends={streakData} />
            : <p className="text-sm text-ink-muted">No friends yet.</p>}
        </section>

        <section className="bg-white border border-ink-faint rounded-2xl p-5">
          <p className="text-xs font-medium text-ink-muted mb-4">2026 activity</p>
          <YearTimeline hangoutDates={hangoutDates} />
          <p className="text-xs text-ink-muted mt-3">
            {totalEvents} event{totalEvents !== 1 ? "s" : ""} this year
          </p>
        </section>
      </div>

      {totalEvents > 0 && (
        <section className="bg-white border border-ink-faint rounded-2xl p-5">
          <p className="text-xs font-medium text-ink-muted mb-4">Recent hangouts</p>
          <RecentFeed initialEvents={allEvents} initialTotal={totalEvents} />
        </section>
      )}

      {friends.length === 0 && (
        <div className="text-center py-16 text-ink-muted">
          <p className="font-display text-xl font-medium text-ink mb-2">No friends yet.</p>
          <Link href="/friends" className="text-moss font-medium hover:text-moss-dark">
            Add your first friend →
          </Link>
        </div>
      )}
    </div>
  );
}
