import { prisma } from "@/lib/prisma";
import { geocode } from "@/lib/geocode";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const friendId = searchParams.get("friendId");
  const status = searchParams.get("status") ?? "logged";
  const skip = parseInt(searchParams.get("skip") ?? "0", 10);
  const take = parseInt(searchParams.get("take") ?? "100", 10);

  const where = {
    ...(status !== "all" && { status }),
    ...(friendId && { friends: { some: { id: friendId } } }),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { friends: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { startDate: "desc" },
      skip,
      take,
    }),
    prisma.event.count({ where }),
  ]);

  return Response.json({ events, total });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { friendIds, startDate, endDate, notes, location, eventType, city, whoTraveled, title, status } = body;

  const eventStatus = status === "planned" ? "planned" : "logged";
  const ids: string[] = Array.isArray(friendIds) ? friendIds : [];
  if (!startDate || (eventStatus === "logged" && ids.length === 0)) {
    return Response.json(
      { error: eventStatus === "logged" ? "friendIds and startDate are required" : "startDate is required" },
      { status: 400 },
    );
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
      status: eventStatus,
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
