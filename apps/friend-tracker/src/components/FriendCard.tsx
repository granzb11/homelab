import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface FriendCardProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  lastHangout: string | null;
  daysSinceSeen: number | null;
}

function badgeStyle(days: number | null) {
  if (days === null) return { label: "Never", className: "bg-panel text-ink-muted" };
  if (days <= 7)     return { label: `${days}d`, className: "bg-moss-tint text-moss" };
  if (days <= 30)    return { label: `${days}d`, className: "bg-gold-tint text-ink" };
  return             { label: `${days}d`, className: "bg-panel text-ink-muted" };
}

export function FriendCard({ id, name, avatarUrl, lastHangout, daysSinceSeen }: FriendCardProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const badge = badgeStyle(daysSinceSeen);

  return (
    <Link href={`/friends/${id}`}>
      <div className="bg-white border border-ink-faint rounded-xl p-4 hover:bg-panel cursor-pointer">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-moss-tint text-moss font-semibold text-xs font-display italic flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink truncate">{name}</p>
            <p className="text-xs text-ink-muted">
              {lastHangout ? formatDate(lastHangout) : "No hangouts yet"}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </div>
    </Link>
  );
}
