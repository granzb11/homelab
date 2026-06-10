import { prisma } from "@/lib/prisma";
import { geocode } from "@/lib/geocode";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const friendId = request.nextUrl.searchParams.get("friendId");
  const events = await prisma.event.findMany({
    where: friendId ? { friends: { some: { id: friendId } } } : undefined,
    include: { friends: { select: { id: true, name: true } } },
    orderBy: { startDate: "desc" },
  });
  return Response.json(events);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { friendIds, startDate, endDate, notes, location, eventType, city, whoTraveled, title } = body;

  const ids: string[] = Array.isArray(friendIds) ? friendIds : [];
  if (ids.length === 0 || !startDate) {
    return Response.json({ error: "friendIds and startDate are required" }, { status: 400 });
  }

  let lat: number | null = null;
  let lng: number | null = null;
  const locationStr = city?.trim() || location?.trim() || null;
  if (locationStr) {
    const coords = await geocode(locationStr);
    if (coords) { lat = coords.lat; lng = coords.lng; }
  }

  const event = await prisma.event.create({
    data: {
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notes: notes?.trim() || null,
      location: location?.trim() || null,
      lat,
      lng,
      eventType: eventType?.trim() || null,
      city: city?.trim() || null,
      whoTraveled: whoTraveled?.trim() || null,
      title: title?.trim() || null,
      friends: { connect: ids.map((id) => ({ id })) },
    },
    include: { friends: { select: { id: true, name: true } } },
  });

  return Response.json(event, { status: 201 });
}
