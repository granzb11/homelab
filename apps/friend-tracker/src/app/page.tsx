import { prisma } from "@/lib/prisma";
import { daysSince, computeStreak, extractNextPlan, getWeeklyData } from "@/lib/utils";
import { ItsBeenModal } from "@/components/ItsBeenModal";
import { FriendHeatGrid } from "@/components/FriendHeatGrid";
import { StreakCards } from "@/components/StreakCards";
import { YearTimeline } from "@/components/YearTimeline";
import { NextPlanCards } from "@/components/NextPlanCards";
import { RecentFeed } from "@/components/RecentFeed";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [friends, reminders, allEvents] = await Promise.all([
    prisma.friend.findMany({
      include: { events: { orderBy: { startDate: "desc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.reminder.findMany({
      include: {
        friend: {
          include: { events: { orderBy: { startDate: "desc" }, take: 1 } },
        },
      },
    }),
    prisma.event.findMany({
      include: { friends: { select: { id: true, name: true } } },
      orderBy: { startDate: "desc" },
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
  const topFriends = friendsByDays.slice(0, 6);

  const heatData = topFriends.map((f) => ({
    id: f.id,
    name: f.name,
    avatarUrl: f.avatarUrl ?? null,
    daysSpent: f._daysThisYear,
  }));

  const streakData = topFriends.map((f) => ({
    id: f.id,
    name: f.name,
    avatarUrl: f.avatarUrl ?? null,
    streak: computeStreak(f.events.map((e) => e.startDate)),
    totalDays: f.events.reduce((sum, e) => sum + eventDays(e), 0),
    weeklyData: getWeeklyData(f.events.map((e) => e.startDate)),
  }));

  const hangoutDates = allEvents.map((e) => e.startDate.toISOString());
  const totalEvents = allEvents.length;
  const recentEvents = allEvents.slice(0, 15);

  return (
    <div className="space-y-10">
      <ItsBeenModal alerts={alerts} />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-semibold text-ink">Dashboard</h1>
        <Link
          href="/hangouts/new"
          className="bg-moss text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-moss-dark"
        >
          Log hangout
        </Link>
      </div>

      {plans.length > 0 && (
        <section>
          <p className="text-xs font-medium text-ink-muted mb-3">Coming up</p>
          <NextPlanCards plans={plans} />
        </section>
      )}

      {friends.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-ink-muted">Friends</p>
            {friends.length > 5 && (
              <Link href="/friends" className="text-xs text-moss hover:text-moss-dark font-medium">
                View all {friends.length} →
              </Link>
            )}
          </div>
          <FriendHeatGrid friends={heatData} />
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

      {allEvents.length > 0 && (
        <section className="bg-white border border-ink-faint rounded-2xl p-5">
          <p className="text-xs font-medium text-ink-muted mb-4">Recent hangouts</p>
          <RecentFeed events={recentEvents} />
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
