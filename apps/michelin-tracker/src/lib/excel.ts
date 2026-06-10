import * as XLSX from "xlsx";
import { PriceLevelValues, PairingTypeValues } from "./types";

type PriceLevel = (typeof PriceLevelValues)[number];
type PairingType = (typeof PairingTypeValues)[number];

export interface RestaurantRow {
  name: string;
  city: string;
  country: string;
  stars: number;
  cuisine: string;
  dateVisited: Date;
  rating: number;
  price: PriceLevel;
  pairingType: PairingType;
  pairingPrice: number | null;
  highlightDish: string | null;
  notes: string | null;
  goBack: boolean;
  photoLink: string | null;
}

const PRICE_MAP: Record<string, PriceLevel> = {
  "$": "ONE", "1": "ONE", "one": "ONE",
  "$$": "TWO", "2": "TWO", "two": "TWO",
  "$$$": "THREE", "3": "THREE", "three": "THREE",
  "$$$$": "FOUR", "4": "FOUR", "four": "FOUR",
};

const PAIRING_MAP: Record<string, PairingType> = {
  "wine pairing": "WINE_PAIRING",
  "wine_pairing": "WINE_PAIRING",
  "reserved wine pairing": "RESERVED_WINE_PAIRING",
  "reserved_wine_pairing": "RESERVED_WINE_PAIRING",
  "beverage pairing": "BEVERAGE_PAIRING",
  "beverage_pairing": "BEVERAGE_PAIRING",
  "none": "NONE",
  "": "NONE",
};

export function parseExcelBuffer(buffer: ArrayBuffer): RestaurantRow[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: false,
    defval: null,
  });

  return rows.map((row, i) => {
    const get = (key: string) => {
      const found = Object.keys(row).find(
        (k) => k.trim().toLowerCase() === key.toLowerCase()
      );
      return found ? row[found] : null;
    };

    const name = String(get("name") ?? "").trim();
    const city = String(get("city") ?? "").trim();
    const country = String(get("country") ?? "").trim();
    const stars = parseInt(String(get("stars") ?? "1"), 10);
    const cuisine = String(get("cuisine") ?? "").trim();
    const rawDate = get("dateVisited") ?? get("date_visited") ?? get("date");
    const dateVisited = rawDate ? new Date(String(rawDate)) : new Date();
    const rating = parseFloat(String(get("rating") ?? "0"));
    const rawPrice = String(get("price") ?? "1").trim().toLowerCase();
    const price: PriceLevel = PRICE_MAP[rawPrice] ?? "ONE";
    const rawPairing = String(get("pairingType") ?? get("pairing_type") ?? "none").trim().toLowerCase();
    const pairingType: PairingType = PAIRING_MAP[rawPairing] ?? "NONE";
    const pairingPrice = get("pairingPrice") ?? get("pairing_price");
    const goBack = String(get("goBack") ?? get("go_back") ?? "false").toLowerCase();

    if (!name || !city || !country) {
      throw new Error(`Row ${i + 2}: missing required fields (name, city, country)`);
    }

    return {
      name,
      city,
      country,
      stars: isNaN(stars) ? 1 : Math.min(3, Math.max(1, stars)),
      cuisine,
      dateVisited,
      rating: isNaN(rating) ? 0 : rating,
      price,
      pairingType,
      pairingPrice: pairingPrice != null ? parseFloat(String(pairingPrice)) : null,
      highlightDish: String(get("highlightDish") ?? get("highlight_dish") ?? "").trim() || null,
      notes: String(get("notes") ?? "").trim() || null,
      goBack: ["true", "yes", "1"].includes(goBack),
      photoLink: String(get("photoLink") ?? get("photo_link") ?? "").trim() || null,
    };
  });
}
