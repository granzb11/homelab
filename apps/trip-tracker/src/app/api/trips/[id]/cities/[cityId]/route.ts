import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string; cityId: string }> };

function parseLocalDate(s: string): Date {
  return new Date(s + "T00:00:00Z");
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { cityId } = await ctx.params;
  const body = await req.json();
  const { name, targetStartDate, targetEndDate, notes } = body;

  const city = await prisma.tripCity.update({
    where: { id: cityId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(targetStartDate !== undefined && {
        targetStartDate: targetStartDate ? parseLocalDate(targetStartDate) : null,
      }),
      ...(targetEndDate !== undefined && {
        targetEndDate: targetEndDate ? parseLocalDate(targetEndDate) : null,
      }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
    },
  });

  return NextResponse.json(city);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { cityId } = await ctx.params;
  await prisma.tripCity.delete({ where: { id: cityId } });
  return new Response(null, { status: 204 });
}
