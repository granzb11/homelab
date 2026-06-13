import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncTripHangout } from "@/lib/hangout-sync";

type Ctx = { params: Promise<{ id: string; participantId: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id, participantId } = await ctx.params;
  await prisma.tripParticipant.delete({ where: { id: participantId } });
  await syncTripHangout(id);
  return new NextResponse(null, { status: 204 });
}
