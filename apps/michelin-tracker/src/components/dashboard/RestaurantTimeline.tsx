"use client";

import { useState } from "react";
import type { Restaurant } from "@prisma/client";
import { PAIRING_LABELS } from "@/lib/types";

type RestaurantWithCost = Restaurant & { foodCost?: number | null };

interface Props {
  restaurants: RestaurantWithCost[];
}

function groupByYear(restaurants: RestaurantWithCost[]) {
  const map = new Map<number, Restaurant[]>();
  for (const r of restaurants) {
    const year = new Date(r.dateVisited).getFullYear();
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(r);
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
}

function Stars({ count }: { count: number }) {
  return (
    <span style={{ color: "var(--color-amber)", letterSpacing: "0.08em", fontSize: "0.8125rem" }}>
      {"★".repeat(count)}
    </span>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.125rem 0.5rem",
        background: "var(--color-moss-light)",
        color: "var(--color-moss)",
        borderRadius: "999px",
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
      }}
    >
      {rating.toFixed(1)}
    </span>
  );
}

function TimelineCard({
  restaurant,
  side,
  isLast,
}: {
  restaurant: RestaurantWithCost;
  side: "left" | "right";
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(restaurant.dateVisited);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const hasPairing = restaurant.pairingType !== "NONE";
  const hasDetails =
    restaurant.notes || restaurant.highlightDish || hasPairing || restaurant.goBack;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 2rem 1fr",
        alignItems: "start",
        marginBottom: isLast ? 0 : "0.125rem",
        position: "relative",
      }}
    >
      {/* Left slot */}
      <div style={{ padding: "0 1.5rem 0 0", display: "flex", justifyContent: "flex-end" }}>
        {side === "left" && (
          <Card
            restaurant={restaurant}
            dateStr={dateStr}
            expanded={expanded}
            setExpanded={setExpanded}
            hasDetails={!!hasDetails}
            align="right"
          />
        )}
      </div>

      {/* Centre spine */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Node */}
        <button
          onClick={() => hasDetails && setExpanded((e) => !e)}
          style={{
            width: "0.75rem",
            height: "0.75rem",
            borderRadius: "50%",
            border: `2px solid ${restaurant.stars === 3 ? "var(--color-moss)" : restaurant.stars === 2 ? "var(--color-moss-mid)" : "var(--color-amber)"}`,
            background: expanded
              ? restaurant.stars === 3
                ? "var(--color-moss)"
                : restaurant.stars === 2
                ? "var(--color-moss-mid)"
                : "var(--color-amber)"
              : "var(--color-surface)",
            cursor: hasDetails ? "pointer" : "default",
            flexShrink: 0,
            transition: "background 150ms, transform 150ms",
            transform: expanded ? "scale(1.3)" : "scale(1)",
            marginTop: "0.8rem",
            zIndex: 1,
          }}
          aria-label={restaurant.name}
        />
        {/* Connector line down */}
        {!isLast && (
          <div
            style={{
              width: "1px",
              flex: 1,
              minHeight: "1.5rem",
              background: "var(--color-border)",
            }}
          />
        )}
      </div>

      {/* Right slot */}
      <div style={{ padding: "0 0 0 1.5rem" }}>
        {side === "right" && (
          <Card
            restaurant={restaurant}
            dateStr={dateStr}
            expanded={expanded}
            setExpanded={setExpanded}
            hasDetails={!!hasDetails}
            align="left"
          />
        )}
      </div>
    </div>
  );
}

function Card({
  restaurant,
  dateStr,
  expanded,
  setExpanded,
  hasDetails,
  align,
}: {
  restaurant: RestaurantWithCost;
  dateStr: string;
  expanded: boolean;
  setExpanded: (fn: (e: boolean) => boolean) => void;
  hasDetails: boolean;
  align: "left" | "right";
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => hasDetails && setExpanded((e) => !e)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered || expanded ? "var(--color-panel)" : "var(--color-surface)",
        border: `1px solid ${expanded ? "oklch(0.82 0.05 140)" : "var(--color-border)"}`,
        borderRadius: "0.5rem",
        padding: "0.625rem 0.875rem",
        cursor: hasDetails ? "pointer" : "default",
        transition: "background 150ms, border-color 150ms",
        textAlign: align,
        maxWidth: "18rem",
        marginLeft: align === "left" ? 0 : "auto",
      }}
    >
      {/* Name */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexDirection: align === "right" ? "row-reverse" : "row", flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "var(--font-fraunces)",
            fontWeight: 600,
            fontSize: "0.9375rem",
            letterSpacing: "-0.01em",
            color: "var(--color-ink)",
            lineHeight: 1.2,
          }}
        >
          {restaurant.name}
        </span>
        <Stars count={restaurant.stars} />
      </div>

      {/* City + date + rating + spend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "0.25rem",
          flexDirection: align === "right" ? "row-reverse" : "row",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
          {restaurant.city} · {dateStr}
        </span>
        <RatingBadge rating={restaurant.rating} />
        {restaurant.foodCost != null && (
          <span
            style={{
              display: "inline-block",
              padding: "0.125rem 0.5rem",
              background: "var(--color-panel)",
              color: "var(--color-muted)",
              borderRadius: "999px",
              fontSize: "0.6875rem",
              fontWeight: 500,
              border: "1px solid var(--color-border)",
            }}
          >
            ${restaurant.foodCost} food
          </span>
        )}
        {restaurant.pairingPrice != null && (
          <span
            style={{
              display: "inline-block",
              padding: "0.125rem 0.5rem",
              background: "var(--color-amber-light)",
              color: "oklch(0.45 0.12 55)",
              borderRadius: "999px",
              fontSize: "0.6875rem",
              fontWeight: 500,
            }}
          >
            ${restaurant.pairingPrice} pairing
          </span>
        )}
        {restaurant.goBack && (
          <span style={{ fontSize: "0.6875rem", color: "var(--color-moss)" }}>↩ return</span>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            marginTop: "0.625rem",
            paddingTop: "0.625rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          {restaurant.cuisine && (
            <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
              <span style={{ color: "var(--color-ink)" }}>Cuisine</span> — {restaurant.cuisine}
            </p>
          )}
          {restaurant.highlightDish && (
            <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
              <span style={{ color: "var(--color-ink)" }}>Dish</span> — {restaurant.highlightDish}
            </p>
          )}
          {restaurant.pairingType !== "NONE" && (
            <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
              <span style={{ color: "var(--color-ink)" }}>Pairing</span> — {PAIRING_LABELS[restaurant.pairingType]}
            </p>
          )}
          {restaurant.notes && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-muted)",
                fontStyle: "italic",
                marginTop: "0.125rem",
              }}
            >
              "{restaurant.notes}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function YearMarker({ year }: { year: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 2rem 1fr",
        alignItems: "center",
        marginBottom: "0.125rem",
        marginTop: "1.5rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: "1.5rem" }}>
        <div style={{ width: "3rem", height: "1px", background: "var(--color-border)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span
          style={{
            fontFamily: "var(--font-fraunces)",
            fontWeight: 600,
            fontSize: "0.8125rem",
            color: "var(--color-moss)",
            letterSpacing: "-0.01em",
          }}
        >
          {year}
        </span>
      </div>
      <div style={{ display: "flex", paddingLeft: "1.5rem" }}>
        <div style={{ width: "3rem", height: "1px", background: "var(--color-border)" }} />
      </div>
    </div>
  );
}

export function RestaurantTimeline({ restaurants }: Props) {
  const sorted = [...restaurants].sort(
    (a, b) => new Date(a.dateVisited).getTime() - new Date(b.dateVisited).getTime()
  );
  const grouped = groupByYear(sorted);

  const allItems: { type: "year"; year: number } | { type: "restaurant"; restaurant: RestaurantWithCost; side: "left" | "right" } extends infer T ? T[] : never = [];
  let sideIndex = 0;
  for (const [year, rs] of grouped) {
    allItems.push({ type: "year", year });
    for (const r of rs) {
      allItems.push({ type: "restaurant", restaurant: r, side: sideIndex % 2 === 0 ? "left" : "right" });
      sideIndex++;
    }
  }

  if (restaurants.length === 0) {
    return (
      <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", textAlign: "center", padding: "3rem 0" }}>
        No visits yet — add your first restaurant.
      </p>
    );
  }

  // Collect just the restaurant items to know which is last
  const restaurantItems = allItems.filter((i) => i.type === "restaurant");

  return (
    <div style={{ paddingTop: "0.5rem" }}>
      {/* Legend */}
      <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { color: "var(--color-amber)", label: "1 star" },
          { color: "var(--color-moss-mid)", label: "2 stars" },
          { color: "var(--color-moss)", label: "3 stars" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <div
              style={{
                width: "0.5rem",
                height: "0.5rem",
                borderRadius: "50%",
                background: color,
              }}
            />
            <span style={{ fontSize: "0.6875rem", color: "var(--color-muted)" }}>{label}</span>
          </div>
        ))}
        <span style={{ fontSize: "0.6875rem", color: "var(--color-muted)", marginLeft: "auto" }}>
          Click any card to expand
        </span>
      </div>

      {allItems.map((item, i) => {
        if (item.type === "year") {
          return <YearMarker key={`year-${item.year}`} year={item.year} />;
        }
        const isLast = restaurantItems[restaurantItems.length - 1] === item;
        return (
          <TimelineCard
            key={`${item.restaurant.id}-${i}`}
            restaurant={item.restaurant}
            side={item.side}
            isLast={isLast}
          />
        );
      })}
    </div>
  );
}
