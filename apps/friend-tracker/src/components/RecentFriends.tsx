import Link from "next/link";

export interface RecentFriend {
  id: string;
  name: string;
  avatarUrl: string | null;
  lastSeenDate: Date | string | null;
}

function recencyLabel(date: Date | string | null): { text: string; urgent: boolean } {
  if (!date) return { text: "Never seen", urgent: false };
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - day.getTime()) / 86400000);

  if (diff === 0) return { text: "Today", urgent: false };
  if (diff === 1) return { text: "Yesterday", urgent: false };
  if (diff <= 6)  return { text: `${diff}d ago`, urgent: false };
  if (diff <= 13) return { text: "Last week", urgent: false };
  if (diff <= 30) return { text: `${Math.ceil(diff / 7)}w ago`, urgent: false };
  if (diff <= 60) return { text: `${Math.floor(diff / 30)}mo ago`, urgent: true };
  return { text: `${Math.floor(diff / 30)}mo ago`, urgent: true };
}

export function RecentFriends({ friends }: { friends: RecentFriend[] }) {
  if (friends.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
      {friends.map((f) => {
        const initials = f.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
        const { text, urgent } = recencyLabel(f.lastSeenDate);

        return (
          <Link
            key={f.id}
            href={`/friends/${f.id}`}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            {/* Avatar with recency ring */}
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all duration-150 group-hover:scale-105 ${
                  urgent ? "border-amber-300" : "border-ink-faint group-hover:border-moss"
                }`}
              >
                {f.avatarUrl ? (
                  <img src={f.avatarUrl} alt={f.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-moss-tint flex items-center justify-center text-moss text-sm font-semibold">
                    {initials}
                  </div>
                )}
              </div>
              {urgent && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
              )}
            </div>

            {/* Name */}
            <span className="text-xs text-ink group-hover:text-moss transition-colors leading-none max-w-[56px] truncate text-center">
              {f.name.split(" ")[0]}
            </span>

            {/* Recency */}
            <span className={`text-[10px] leading-none ${urgent ? "text-amber-600" : "text-ink-muted"}`}>
              {text}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
