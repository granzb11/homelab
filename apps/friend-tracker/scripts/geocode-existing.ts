import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function geocodeQuery(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "User-Agent": "FriendTracker/1.0" } });
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function main() {
  const hangouts = await prisma.hangout.findMany({ where: { lat: null } });
  console.log(`Found ${hangouts.length} hangout(s) to geocode`);

  for (const h of hangouts) {
    if (!h.notes) continue;
    const match = h.notes.match(/(?:at|to) ([^.]+)\./);
    if (!match) continue;
    const locationStr = match[1].trim();
    const cityMatch = locationStr.match(/,\s*(.+)$/);
    const query = cityMatch ? cityMatch[1].trim() : locationStr;

    console.log(`  Geocoding: "${query}" ...`);
    const coords = await geocodeQuery(query);

    if (coords) {
      await prisma.hangout.update({
        where: { id: h.id },
        data: { location: locationStr, lat: coords.lat, lng: coords.lng },
      });
      console.log(`  ✓ ${locationStr} → ${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}`);
    } else {
      console.log(`  ✗ No result for: ${query}`);
    }

    await new Promise((r) => setTimeout(r, 1100)); // Nominatim rate limit
  }

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch(console.error);
