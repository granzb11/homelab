// Run: DATABASE_URL=... npx tsx scripts/seed-spreadsheet.ts
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const events = [
  {
    startDate: "2026-04-15",
    eventType: "Wedding",
    location: "The Woodlands Resort",
    city: "Houston, TX",
    whoTraveled: "You",
    friends: ["Chris Dafoe", "Tyler Saxton", "Bharat Gogineni", "Chandler Thomas", "Meg Patton"],
  },
  {
    startDate: "2026-04-22",
    eventType: "Wedding",
    location: "Hilton Hotel",
    city: "Lyons, CO",
    whoTraveled: "Neither",
    friends: ["Chris Dafoe", "Tyler Saxton", "Bharat Gogineni", "Chandler Thomas", "Meg Patton"],
  },
  {
    startDate: "2026-04-26",
    eventType: "Other",
    location: "Chris' House",
    city: "Commerce City, CO",
    whoTraveled: "You",
    friends: ["Chris Dafoe"],
  },
  {
    startDate: "2026-05-23",
    eventType: "Wedding",
    location: "Liza's Parents House",
    city: "Richmond, VA",
    whoTraveled: "Neither",
    friends: ["Mike Zrimm"],
  },
  {
    startDate: "2026-05-24",
    eventType: "Lunch",
    location: "Pisco y Nazca Ceviche",
    city: "Reston, VA",
    whoTraveled: "You",
    friends: ["Charlie Davis", "Allie Davis"],
  },
];

async function main() {
  const allFriends = await prisma.friend.findMany({ select: { id: true, name: true } });
  const friendMap = new Map(allFriends.map((f) => [f.name, f.id]));

  for (const ev of events) {
    const ids = ev.friends
      .map((name) => {
        const id = friendMap.get(name);
        if (!id) console.warn(`Friend not found: ${name}`);
        return id;
      })
      .filter(Boolean) as string[];

    const created = await prisma.event.create({
      data: {
        startDate: new Date(ev.startDate),
        eventType: ev.eventType,
        location: ev.location,
        city: ev.city,
        whoTraveled: ev.whoTraveled,
        friends: { connect: ids.map((id) => ({ id })) },
      },
    });
    console.log(`  + ${ev.startDate} ${ev.eventType} @ ${ev.city} [${ev.friends.join(", ")}] → ${created.id}`);
  }

  console.log(`\nSeeded ${events.length} events.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
