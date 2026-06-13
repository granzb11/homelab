import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncTripHangout } from "@/lib/hangout-sync";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const participants = await prisma.tripParticipant.findMany({
    where: { tripId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(participants);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { friendId, joinDate, leaveDate, notes } = body;
  if (!friendId) return NextResponse.json({ error: "friendId required" }, { status: 400 });

  const participant = await prisma.tripParticipant.upsert({
    where: { tripId_friendId: { tripId: id, friendId } },
    create: {
      tripId: id,
      friendId,
      joinDate: joinDate ? new Date(joinDate) : null,
      leaveDate: leaveDate ? new Date(leaveDate) : null,
      notes: notes?.trim() || null,
    },
    update: {
      joinDate: joinDate ? new Date(joinDate) : null,
      leaveDate: leaveDate ? new Date(leaveDate) : null,
      notes: notes?.trim() || null,
    },
  });
  await syncTripHangout(id);
  return NextResponse.json(participant, { status: 201 });
}
