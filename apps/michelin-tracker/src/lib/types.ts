import { z } from "zod";

export const PriceLevelValues = ["ONE", "TWO", "THREE", "FOUR"] as const;
export const PairingTypeValues = [
  "WINE_PAIRING",
  "RESERVED_WINE_PAIRING",
  "BEVERAGE_PAIRING",
  "NONE",
] as const;

export const PRICE_LABELS: Record<string, string> = {
  ONE: "$",
  TWO: "$$",
  THREE: "$$$",
  FOUR: "$$$$",
};

export const PAIRING_LABELS: Record<string, string> = {
  WINE_PAIRING: "Wine Pairing",
  RESERVED_WINE_PAIRING: "Reserved Wine Pairing",
  BEVERAGE_PAIRING: "Beverage Pairing",
  NONE: "None",
};

export const RestaurantSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  stars: z.coerce.number().int().min(1).max(3),
  cuisine: z.string().min(1),
  dateVisited: z.coerce.date(),
  rating: z.coerce.number().min(0).max(10),
  price: z.enum(PriceLevelValues),
  pairingType: z.enum(PairingTypeValues).default("NONE"),
  foodCost: z.coerce.number().optional().nullable(),
  pairingPrice: z.coerce.number().optional().nullable(),
  highlightDish: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  goBack: z.coerce.boolean().default(false),
  photoLink: z.string().url().optional().nullable().or(z.literal("")),
});
