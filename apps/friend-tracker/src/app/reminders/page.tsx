import { prisma } from "@/lib/prisma";
import { daysSince } from "@/lib/utils";
import { ReminderForm } from "@/components/ReminderForm";
import DeleteReminderButton from "./DeleteReminderButton";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const [friends, reminders] = await Promise.all([
    prisma.friend.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.reminder.findMany({
      include: {
        friend: {
          include: { events: { orderBy: { startDate: "desc" }, take: 1 } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const rows = reminders.map((r) => {
    const last = r.friend.events[0]?.startDate ?? null;
    const days = daysSince(last);
    return {
      id: r.id,
      friendName: r.friend.name,
      thresholdDays: r.thresholdDays,
      daysSinceSeen: days,
      isTriggered: days === null || days >= r.thresholdDays,
    };
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-display font-semibold text-ink mb-8">Reminders</h1>

      <div className="bg-panel border border-ink-faint rounded-xl p-5 mb-8">
        <p className="text-xs font-medium text-ink-muted mb-4">Add reminder</p>
        <ReminderForm friends={friends} />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No reminders set yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted border-b border-ink-faint">
              <th className="pb-3 font-medium">Friend</th>
              <th className="pb-3 font-medium">Alert after</th>
              <th className="pb-3 font-medium">Days since seen</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-faint">
            {rows.map((r) => (
              <tr key={r.id} className={r.isTriggered ? "bg-gold-tint" : ""}>
                <td className="py-3.5 font-medium text-ink">{r.friendName}</td>
                <td className="py-3.5 text-ink-muted">{r.thresholdDays}d</td>
                <td className="py-3.5 text-ink-muted">
                  {r.daysSinceSeen !== null ? `${r.daysSinceSeen}d` : "Never"}
                </td>
                <td className="py-3.5">
                  {r.isTriggered ? (
                    <span className="text-xs font-medium bg-gold-tint text-ink border border-gold rounded-full px-2 py-0.5">
                      Due
                    </span>
                  ) : (
                    <span className="text-xs font-medium bg-moss-tint text-moss rounded-full px-2 py-0.5">
                      OK
                    </span>
                  )}
                </td>
                <td className="py-3.5 text-right">
                  <DeleteReminderButton id={r.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
