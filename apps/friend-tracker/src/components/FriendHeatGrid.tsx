import Link from "next/link";

interface FriendStatus {
  id: string;
  name: string;
  avatarUrl: string | null;
  daysSpent: number;
}

function heatStyle(days: number, max: number): { bg: string; textColor: string } {
  if (days === 0 || max === 0) return { bg: "oklch(0.94 0.004 140)", textColor: "oklch(0.44 0.015 140)" };
  const t = days / max;
  if (t >= 0.75) return { bg: "oklch(0.35 0.11 140)", textColor: "white" };
  if (t >= 0.45) return { bg: "oklch(0.48 0.12 140)", textColor: "white" };
  if (t >= 0.2)  return { bg: "oklch(0.65 0.15 60)",  textColor: "oklch(0.12 0.015 140)" };
  return               { bg: "oklch(0.88 0.06 60)",   textColor: "oklch(0.44 0.015 140)" };
}

export function FriendHeatGrid({ friends }: { friends: FriendStatus[] }) {
  const max = Math.max(...friends.map((f) => f.daysSpent), 1);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {friends.map((f) => {
        const { bg, textColor } = heatStyle(f.daysSpent, max);
        const initials = f.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        const label = f.daysSpent === 0 ? "0 days" : `${f.daysSpent} day${f.daysSpent !== 1 ? "s" : ""}`;
        return (
          <Link key={f.id} href={`/friends/${f.id}`}>
            <div
              className="rounded-2xl p-5 flex flex-col items-center gap-2 hover:scale-[1.02] cursor-pointer"
              style={{ backgroundColor: bg, color: textColor }}
            >
              {f.avatarUrl ? (
                <img
                  src={f.avatarUrl}
                  alt={f.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl font-display"
                  style={{ backgroundColor: "rgba(255,255,255,0.18)", color: textColor }}
                >
                  {initials}
                </div>
              )}
              <p className="font-medium text-sm text-center leading-tight">{f.name}</p>
              <p className="text-xs" style={{ opacity: 0.75 }}>{label}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
