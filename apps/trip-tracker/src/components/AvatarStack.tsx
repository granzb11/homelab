"use client";

import { useState } from "react";
import type { Friend } from "@/lib/friends";

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function AvatarStack({ friends }: { friends: Friend[] }) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (friends.length === 0) return null;

  return (
    <div
      className="flex items-center flex-shrink-0"
      style={{ paddingRight: expanded ? friends.length * 4 : 0, transition: "padding-right 220ms ease-out" }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => { setExpanded(false); setHoveredId(null); }}
    >
      {friends.map((f, i) => {
        const isHovered = hoveredId === f.id;
        return (
          <div
            key={f.id}
            className="relative"
            style={{
              marginLeft: i === 0 ? 0 : expanded ? 5 : -8,
              zIndex: isHovered ? 50 : friends.length - i,
              transform: isHovered ? "translateY(-2px) scale(1.1)" : "none",
              transition: "margin-left 220ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 150ms ease-out",
            }}
            onMouseEnter={() => setHoveredId(f.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {f.avatarUrl ? (
              <img
                src={f.avatarUrl}
                alt={f.name}
                className="w-6 h-6 rounded-full object-cover border-2 border-white"
                style={{ boxShadow: isHovered ? "0 2px 8px oklch(0 0 0 / 0.22)" : "0 1px 3px oklch(0 0 0 / 0.12)" }}
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full border-2 border-white bg-moss-tint text-moss text-[9px] font-bold flex items-center justify-center font-display"
                style={{ boxShadow: isHovered ? "0 2px 8px oklch(0 0 0 / 0.22)" : "0 1px 3px oklch(0 0 0 / 0.12)" }}
              >
                {initials(f.name)}
              </div>
            )}

            {isHovered && (
              <div
                className="absolute top-full mt-1.5 bg-ink text-white text-[11px] font-medium px-2 py-0.5 whitespace-nowrap pointer-events-none"
                style={{ left: "50%", transform: "translateX(-50%)", zIndex: 100 }}
              >
                <div className="absolute bottom-full border-4 border-transparent border-b-ink" style={{ left: "50%", transform: "translateX(-50%)" }} />
                {f.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
