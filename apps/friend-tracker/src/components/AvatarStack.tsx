"use client";

import { useState } from "react";
import Link from "next/link";

interface StackFriend {
  id: string;
  name: string;
  avatarUrl: string | null;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function AvatarStack({ friends }: { friends: StackFriend[] }) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (friends.length === 0) return null;

  return (
    <div
      className="flex items-center"
      style={{ paddingRight: expanded ? friends.length * 4 : 0, transition: "padding-right 220ms ease-out" }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => { setExpanded(false); setHoveredId(null); }}
    >
      {friends.map((f, i) => {
        const isHovered = hoveredId === f.id;
        return (
          <Link
            key={f.id}
            href={`/friends/${f.id}`}
            className="relative block w-7"
            style={{
              marginLeft: i === 0 ? 0 : expanded ? 5 : -9,
              zIndex: isHovered ? 50 : friends.length - i,
              transform: isHovered ? "translateY(-3px) scale(1.12)" : "none",
              transition: "margin-left 220ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 150ms ease-out",
            }}
            onMouseEnter={() => setHoveredId(f.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {f.avatarUrl ? (
              <img
                src={f.avatarUrl}
                alt={f.name}
                className="w-7 h-7 rounded-full object-cover border-2 border-white"
                style={{ boxShadow: isHovered ? "0 2px 8px oklch(0 0 0 / 0.22)" : "0 1px 3px oklch(0 0 0 / 0.12)" }}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full border-2 border-white bg-moss-tint text-moss text-[10px] font-bold flex items-center justify-center font-display"
                style={{ boxShadow: isHovered ? "0 2px 8px oklch(0 0 0 / 0.22)" : "0 1px 3px oklch(0 0 0 / 0.12)" }}
              >
                {initials(f.name)}
              </div>
            )}

            {/* Name tooltip */}
            {isHovered && (
              <div
                className="absolute top-full mt-2 bg-ink text-white text-[11px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap pointer-events-none"
                style={{ left: "50%", transform: "translateX(-50%)", animation: "tooltip-in 120ms ease-out forwards", zIndex: 100 }}
              >
                <div className="absolute bottom-full border-4 border-transparent border-b-ink" style={{ left: "50%", transform: "translateX(-50%)" }} />
                {f.name}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
