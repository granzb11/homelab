import Link from "next/link";

interface FriendStreak {
  id: string;
  name: string;
  avatarUrl: string | null;
  streak: number;
  totalDays: number;
  weeklyData: number[];
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const W = 60, H = 24;
  if (data.every((d) => d === 0)) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="oklch(0.88 0.004 140)" strokeWidth="1.5" />
      </svg>
    );
  }
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - (v / max) * (H - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="flex-shrink-0">
      <polyline
        points={pts}
        fill="none"
        stroke="oklch(0.35 0.11 140)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StreakCards({ friends }: { friends: FriendStreak[] }) {
  const sorted = [...friends].sort((a, b) => b.totalDays - a.totalDays);
  return (
    <div className="space-y-1">
      {sorted.map((f) => {
        const initials = f.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        return (
          <Link key={f.id} href={`/friends/${f.id}`}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-moss-tint">
              {f.avatarUrl ? (
                <img src={f.avatarUrl} alt={f.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-moss-tint text-moss font-semibold text-xs flex items-center justify-center flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-ink truncate">{f.name}</p>
                <p className="text-xs text-ink-muted">{f.totalDays} day{f.totalDays !== 1 ? "s" : ""}</p>
              </div>
              <Sparkline data={f.weeklyData} />
              {f.streak > 0 && (
                <div className="flex-shrink-0 text-xs font-medium text-moss">
                  {f.streak}w
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
