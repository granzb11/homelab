"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  RestaurantSchema,
  PriceLevelValues,
  PairingTypeValues,
  PRICE_LABELS,
  PAIRING_LABELS,
} from "@/lib/types";
import type { Restaurant } from "@prisma/client";

type RestaurantWithCost = Restaurant & { foodCost?: number | null };
import { createRestaurant, updateRestaurant } from "@/actions/restaurant";
import { useTransition } from "react";

type FormValues = z.input<typeof RestaurantSchema>;
type FormOutput = z.output<typeof RestaurantSchema>;

interface Props {
  initial?: RestaurantWithCost;
  onDone: () => void;
}

function fmt(d: Date | string) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString().split("T")[0];
}

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "var(--color-panel)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.375rem",
  padding: "0.4375rem 0.625rem",
  fontSize: "0.8125rem",
  color: "var(--color-ink)",
  fontFamily: "var(--font-mono)",
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  color: "var(--color-muted)",
  marginBottom: "0.25rem",
  letterSpacing: "0.01em",
};

const errStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  color: "oklch(0.5 0.2 15)",
  marginTop: "0.25rem",
};

export function RestaurantForm({ initial, onDone }: Props) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(RestaurantSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          city: initial.city,
          country: initial.country,
          stars: String(initial.stars) as unknown as number,
          cuisine: initial.cuisine,
          dateVisited: fmt(initial.dateVisited),
          rating: String(initial.rating) as unknown as number,
          price: initial.price,
          pairingType: initial.pairingType,
          foodCost: initial.foodCost != null
            ? String(initial.foodCost) as unknown as number
            : undefined,
          pairingPrice: initial.pairingPrice != null
            ? String(initial.pairingPrice) as unknown as number
            : undefined,
          highlightDish: initial.highlightDish ?? "",
          notes: initial.notes ?? "",
          goBack: initial.goBack,
          photoLink: initial.photoLink ?? "",
        }
      : { pairingType: "NONE", stars: "1" as unknown as number, goBack: false },
  });

  const onSubmit = (data: FormOutput) => {
    startTransition(async () => {
      if (initial) {
        await updateRestaurant(initial.id, data);
      } else {
        await createRestaurant(data);
      }
      onDone();
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 1rem" }}
    >
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Restaurant Name *</label>
        <input {...register("name")} style={fieldStyle} />
        {errors.name && <p style={errStyle}>{errors.name.message}</p>}
      </div>
      <div>
        <label style={labelStyle}>City *</label>
        <input {...register("city")} style={fieldStyle} />
        {errors.city && <p style={errStyle}>{errors.city.message}</p>}
      </div>
      <div>
        <label style={labelStyle}>Country *</label>
        <input {...register("country")} style={fieldStyle} />
        {errors.country && <p style={errStyle}>{errors.country.message}</p>}
      </div>
      <div>
        <label style={labelStyle}>Michelin Stars *</label>
        <select {...register("stars")} style={fieldStyle}>
          {[1, 2, 3].map((s) => (
            <option key={s} value={s}>
              {"★".repeat(s)} {s === 1 ? "One Star" : s === 2 ? "Two Stars" : "Three Stars"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Cuisine *</label>
        <input {...register("cuisine")} style={fieldStyle} />
        {errors.cuisine && <p style={errStyle}>{errors.cuisine.message}</p>}
      </div>
      <div>
        <label style={labelStyle}>Date Visited *</label>
        <input type="date" {...register("dateVisited")} style={fieldStyle} />
      </div>
      <div>
        <label style={labelStyle}>Rating (1–10) *</label>
        <input type="number" step="0.1" min="1" max="10" {...register("rating")} style={fieldStyle} />
        {errors.rating && <p style={errStyle}>{errors.rating.message}</p>}
      </div>
      <div>
        <label style={labelStyle}>Price Level *</label>
        <select {...register("price")} style={fieldStyle}>
          {PriceLevelValues.map((p) => (
            <option key={p} value={p}>{PRICE_LABELS[p]}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Food Cost ($)</label>
        <input type="number" step="0.01" {...register("foodCost")} style={fieldStyle} placeholder="Optional" />
      </div>
      <div>
        <label style={labelStyle}>Pairing Type</label>
        <select {...register("pairingType")} style={fieldStyle}>
          {PairingTypeValues.map((p) => (
            <option key={p} value={p}>{PAIRING_LABELS[p]}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Pairing Price ($)</label>
        <input type="number" step="0.01" {...register("pairingPrice")} style={fieldStyle} placeholder="Optional" />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Highlight Dish</label>
        <input {...register("highlightDish")} style={fieldStyle} placeholder="Optional" />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Notes</label>
        <textarea
          {...register("notes")}
          rows={3}
          style={{ ...fieldStyle, resize: "vertical" }}
          placeholder="Optional"
        />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Photo Link</label>
        <input {...register("photoLink")} style={fieldStyle} placeholder="https://…" />
        {errors.photoLink && <p style={errStyle}>{errors.photoLink.message}</p>}
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="checkbox"
          id="goBack"
          {...register("goBack")}
          style={{ accentColor: "var(--color-moss)", width: "1rem", height: "1rem" }}
        />
        <label htmlFor="goBack" style={{ fontSize: "0.8125rem", color: "var(--color-ink)", cursor: "pointer" }}>
          Would go back?
        </label>
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
        <button
          type="button"
          onClick={onDone}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.8125rem",
            border: "1px solid var(--color-border)",
            borderRadius: "0.375rem",
            background: "none",
            color: "var(--color-muted)",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            transition: "color 150ms, border-color 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-ink)";
            e.currentTarget.style.borderColor = "var(--color-muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-muted)";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.8125rem",
            background: pending ? "var(--color-muted)" : "var(--color-moss)",
            color: "var(--color-surface)",
            border: "none",
            borderRadius: "0.375rem",
            cursor: pending ? "not-allowed" : "pointer",
            fontFamily: "var(--font-mono)",
            transition: "background 150ms",
            opacity: pending ? 0.6 : 1,
          }}
          onMouseEnter={(e) => !pending && (e.currentTarget.style.background = "oklch(0.28 0.10 140)")}
          onMouseLeave={(e) => !pending && (e.currentTarget.style.background = "var(--color-moss)")}
        >
          {pending ? "Saving…" : initial ? "Update" : "Add Restaurant"}
        </button>
      </div>
    </form>
  );
}
