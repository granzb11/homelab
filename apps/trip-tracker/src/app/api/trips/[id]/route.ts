import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncTripHangout } from "@/lib/hangout-sync";
import { deleteHangout } from "@/lib/friends";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      events: {
        include: { participants: true, attachments: true },
        orderBy: { startDate: "asc" },
      },
      expenses: {
        include: { participants: true },
        orderBy: { date: "asc" },
      },
      participants: { orderBy: { createdAt: "asc" } },
      todos: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!trip) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(trip);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { name, description, destination, startDate, endDate, coverImageUrl, status, budget } = body;

  const trip = await prisma.trip.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(destination !== undefined && { destination: destination?.trim() || null }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(coverImageUrl !== undefined && { coverImageUrl }),
      ...(status !== undefined && { status }),
      ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
    },
  });
  await syncTripHangout(id);
  return NextResponse.json(trip);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    select: { hangoutEventId: true },
  });
  if (trip?.hangoutEventId) await deleteHangout(trip.hangoutEventId);
  await prisma.trip.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
