"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type { Restaurant } from "@prisma/client";
import { PAIRING_LABELS } from "@/lib/types";

type RestaurantWithCost = Restaurant & { foodCost?: number | null };
import { deleteRestaurant } from "@/actions/restaurant";
import { RestaurantForm } from "./RestaurantForm";
import { FilterBar } from "./FilterBar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type SortKey = "name" | "city" | "stars" | "dateVisited" | "rating" | "price";

export function RestaurantTable() {
  const [sort, setSort] = useState<SortKey>("dateVisited");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState({ stars: "", country: "", cuisine: "" });
  const [editing, setEditing] = useState<RestaurantWithCost | null | "new">(null);

  const params = new URLSearchParams();
  if (filters.stars) params.set("stars", filters.stars);
  if (filters.country) params.set("country", filters.country);
  if (filters.cuisine) params.set("cuisine", filters.cuisine);
  params.set("sort", sort);
  params.set("order", order);

  const { data: restaurants = [], mutate } = useSWR<RestaurantWithCost[]>(
    `/api/restaurants?${params}`,
    fetcher
  );

  const handleSort = (key: SortKey) => {
    if (sort === key) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setOrder("desc");
    }
  };

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm("Delete this restaurant?")) return;
      await deleteRestaurant(id);
      mutate();
    },
    [mutate]
  );

  const thStyle: React.CSSProperties = {
    padding: "0.5rem 0.75rem",
    textAlign: "left",
    fontSize: "0.6875rem",
    color: "var(--color-muted)",
    letterSpacing: "0.01em",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    background: "var(--color-panel)",
    fontFamily: "var(--font-mono)",
    transition: "color 150ms",
  };

  const tdStyle: React.CSSProperties = {
    padding: "0.625rem 0.75rem",
    fontSize: "0.8125rem",
    color: "var(--color-ink)",
    whiteSpace: "nowrap",
    borderTop: "1px solid var(--color-border)",
  };

  const SortIndicator = ({ k }: { k: SortKey }) =>
    sort === k ? (
      <span style={{ color: "var(--color-moss)", marginLeft: "0.25rem" }}>
        {order === "asc" ? "↑" : "↓"}
      </span>
    ) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1
            style={{
              fontFamily: "var(--font-fraunces)",
              fontWeight: 600,
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--color-ink)",
              marginBottom: "0.25rem",
            }}
          >
            Restaurants
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
            {restaurants.length} {restaurants.length === 1 ? "visit" : "visits"}
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--color-moss)",
            color: "var(--color-surface)",
            border: "none",
            borderRadius: "0.375rem",
            fontSize: "0.8125rem",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            transition: "background 150ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.28 0.10 140)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-moss)")}
        >
          + Add Restaurant
        </button>
      </div>

      <FilterBar value={filters} onChange={setFilters} />

      <div
        className="overflow-x-auto rounded-xl mt-4"
        style={{ border: "1px solid var(--color-border)" }}
      >
        <table style={{ minWidth: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[
                { key: "name", label: "Name" },
                { key: "city", label: "City" },
                { key: "stars", label: "Stars" },
                { key: null, label: "Cuisine", hideSmall: true },
                { key: "dateVisited", label: "Visited" },
                { key: "rating", label: "Rating" },
                { key: null, label: "Food $", hideMed: true },
                { key: null, label: "Pairing $", hideMed: true },
                { key: null, label: "Return", hideMed: true },
                { key: null, label: "" },
              ].map(({ key, label }, i) => (
                <th
                  key={i}
                  style={thStyle}
                  onClick={key ? () => handleSort(key as SortKey) : undefined}
                  onMouseEnter={(e) => key && (e.currentTarget.style.color = "var(--color-ink)")}
                  onMouseLeave={(e) => key && (e.currentTarget.style.color = "var(--color-muted)")}
                >
                  {label}
                  {key && <SortIndicator k={key as SortKey} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {restaurants.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    ...tdStyle,
                    textAlign: "center",
                    color: "var(--color-muted)",
                    padding: "3rem 0.75rem",
                  }}
                >
                  No restaurants yet — add one or import your Excel file.
                </td>
              </tr>
            )}
            {restaurants.map((r) => (
              <tr
                key={r.id}
                style={{ transition: "background 120ms" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-panel)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <td style={{ ...tdStyle, fontWeight: 500 }}>
                  {r.photoLink ? (
                    <a
                      href={r.photoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--color-moss)", textDecoration: "none", transition: "opacity 150ms" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      {r.name}
                    </a>
                  ) : r.name}
                </td>
                <td style={{ ...tdStyle, color: "var(--color-muted)" }}>
                  {r.city}, {r.country}
                </td>
                <td style={tdStyle}>
                  <span style={{ color: "var(--color-amber)", letterSpacing: "0.05em" }}>
                    {"★".repeat(r.stars)}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: "var(--color-muted)" }}>{r.cuisine}</td>
                <td style={{ ...tdStyle, color: "var(--color-muted)" }}>
                  {new Date(r.dateVisited).toLocaleDateString()}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.125rem 0.5rem",
                      background: "var(--color-moss-light)",
                      color: "var(--color-moss)",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  >
                    {r.rating.toFixed(1)}
                  </span>
                </td>
                <td style={tdStyle}>
                  {r.foodCost != null
                    ? <span style={{ color: "var(--color-ink)" }}>${r.foodCost}</span>
                    : <span style={{ color: "var(--color-muted)" }}>—</span>}
                </td>
                <td style={tdStyle}>
                  {r.pairingType !== "NONE" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                        {PAIRING_LABELS[r.pairingType]}
                      </span>
                      {r.pairingPrice != null && (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.125rem 0.375rem",
                            background: "var(--color-amber-light)",
                            color: "oklch(0.45 0.12 55)",
                            borderRadius: "999px",
                            fontSize: "0.6875rem",
                            fontWeight: 500,
                            width: "fit-content",
                          }}
                        >
                          ${r.pairingPrice}
                        </span>
                      )}
                    </div>
                  ) : <span style={{ color: "var(--color-muted)" }}>—</span>}
                </td>
                <td style={{ ...tdStyle, color: "var(--color-muted)" }}>
                  {r.goBack ? (
                    <span style={{ color: "var(--color-moss)" }}>✓</span>
                  ) : "—"}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={() => setEditing(r)}
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-muted)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        transition: "color 150ms",
                        fontFamily: "var(--font-mono)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-ink)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted)")}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-muted)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        transition: "color 150ms",
                        fontFamily: "var(--font-mono)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.5 0.2 15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted)")}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "oklch(0.12 0.015 140 / 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "0.75rem",
              border: "1px solid var(--color-border)",
              width: "100%",
              maxWidth: "32rem",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.5rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-fraunces)",
                fontWeight: 600,
                fontSize: "1.25rem",
                letterSpacing: "-0.02em",
                color: "var(--color-ink)",
                marginBottom: "1.25rem",
              }}
            >
              {editing === "new" ? "Add Restaurant" : "Edit Restaurant"}
            </h2>
            <RestaurantForm
              initial={editing === "new" ? undefined : editing}
              onDone={() => {
                setEditing(null);
                mutate();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
