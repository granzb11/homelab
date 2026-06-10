import { prisma } from "@/lib/prisma";
import { geocode } from "@/lib/geocode";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { friends: { select: { id: true, name: true } } },
  });
  if (!event) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(event);
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { startDate, endDate, notes, location, eventType, city, whoTraveled, friendIds, title } = body;

  let lat: number | undefined;
  let lng: number | undefined;
  const locationStr = city?.trim() || location?.trim() || null;
  if (locationStr) {
    const coords = await geocode(locationStr);
    if (coords) { lat = coords.lat; lng = coords.lng; }
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(location !== undefined && { location: location?.trim() || null }),
      ...(eventType !== undefined && { eventType: eventType?.trim() || null }),
      ...(city !== undefined && { city: city?.trim() || null }),
      ...(whoTraveled !== undefined && { whoTraveled: whoTraveled?.trim() || null }),
      ...(title !== undefined && { title: title?.trim() || null }),
      ...(lat !== undefined && { lat }),
      ...(lng !== undefined && { lng }),
      ...(friendIds !== undefined && {
        friends: { set: (friendIds as string[]).map((fid) => ({ id: fid })) },
      }),
    },
    include: { friends: { select: { id: true, name: true } } },
  });

  return Response.json(event);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.event.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
