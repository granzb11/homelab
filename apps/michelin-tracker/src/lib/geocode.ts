const NOMINATIM = "https://nominatim.openstreetmap.org/search";

export async function geocodeCity(
  city: string,
  country: string
): Promise<[number, number] | null> {
  try {
    const params = new URLSearchParams({
      q: `${city}, ${country}`,
      format: "json",
      limit: "1",
    });
    const res = await fetch(`${NOMINATIM}?${params}`, {
      headers: { "User-Agent": "michelin-tracker/1.0" },
    });
    const data = await res.json();
    if (data.length === 0) return null;
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {
    return null;
  }
}

export async function geocodeBatch(
  places: { city: string; country: string }[]
): Promise<Map<string, [number, number]>> {
  const result = new Map<string, [number, number]>();
  for (const { city, country } of places) {
    const key = `${city.toLowerCase()},${country.toLowerCase()}`;
    if (result.has(key)) continue;
    const coords = await geocodeCity(city, country);
    if (coords) result.set(key, coords);
    await new Promise((r) => setTimeout(r, 300));
  }
  return result;
}
