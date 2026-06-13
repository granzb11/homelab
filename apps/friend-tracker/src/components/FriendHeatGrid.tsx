import Link from "next/link";

export interface FriendStatus {
  id: string;
  name: string;
  avatarUrl: string | null;
  daysSpent: number;
  /** If set, shown instead of the days-spent label */
  sublabel?: string;
}

function heatStyle(days: number, max: number): { bg: string; textColor: string } {
  if (days === 0 || max === 0) return { bg: "oklch(0.94 0.004 140)", textColor: "oklch(0.44 0.015 140)" };
  const t = days / max;
  if (t >= 0.75) return { bg: "oklch(0.35 0.11 140)", textColor: "white" };
  if (t >= 0.45) return { bg: "oklch(0.48 0.12 140)", textColor: "white" };
  if (t >= 0.2)  return { bg: "oklch(0.65 0.15 60)",  textColor: "oklch(0.12 0.015 140)" };
  return               { bg: "oklch(0.88 0.06 60)",   textColor: "oklch(0.44 0.015 140)" };
}

export function FriendHeatGrid({
  friends,
  dividerAfter,
}: {
  friends: FriendStatus[];
  dividerAfter?: number;
}) {
  const max = Math.max(...friends.map((f) => f.daysSpent), 1);
  return (
    <div className="grid grid-cols-4 gap-3">
      {friends.map((f, i) => {
        const { bg, textColor } = heatStyle(f.daysSpent, max);
        const initials = f.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        const label = f.sublabel ?? (f.daysSpent === 0 ? "0d" : `${f.daysSpent}d`);
        const isFirstOfSecondGroup = dividerAfter !== undefined && i === dividerAfter;
        return (
          <>
            {isFirstOfSecondGroup && (
              <div key={`divider-${i}`} className="col-span-4 border-t border-ink-faint -my-1" />
            )}
            <Link key={f.id} href={`/friends/${f.id}`}>
              <div
                className="rounded-2xl p-3 flex flex-col items-center gap-2 hover:scale-[1.02] cursor-pointer transition-transform"
                style={{ backgroundColor: bg, color: textColor }}
              >
                {f.avatarUrl ? (
                  <img
                    src={f.avatarUrl}
                    alt={f.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base font-display"
                    style={{ backgroundColor: "rgba(255,255,255,0.18)", color: textColor }}
                  >
                    {initials}
                  </div>
                )}
                <p className="font-medium text-xs text-center leading-tight truncate w-full">{f.name.split(" ")[0]}</p>
                <p className="text-[10px]" style={{ opacity: 0.75 }}>{label}</p>
              </div>
            </Link>
          </>
        );
      })}
    </div>
  );
}
