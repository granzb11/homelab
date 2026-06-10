import Link from "next/link";

interface Plan {
  friendName: string;
  friendId: string;
  plan: string;
  daysSinceSeen: number | null;
}

export function NextPlanCards({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) return null;
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {plans.map((p, i) => (
        <div
          key={i}
          className="bg-panel border border-ink-faint rounded-2xl p-4 min-w-[190px] flex-shrink-0 flex flex-col justify-between"
        >
          <div>
            <p className="text-xs text-moss font-medium mb-1.5">Next up</p>
            <p className="font-medium text-ink text-sm leading-snug mb-1">{p.plan}</p>
            <p className="text-xs text-ink-muted">
              with {p.friendName}
              {p.daysSinceSeen !== null && ` · ${p.daysSinceSeen}d ago`}
            </p>
          </div>
          <Link
            href={`/hangouts/new?friendId=${p.friendId}`}
            className="mt-4 block text-center text-xs bg-moss text-white rounded-xl px-3 py-2 font-medium hover:bg-moss-dark"
          >
            Log hangout
          </Link>
        </div>
      ))}
    </div>
  );
}
