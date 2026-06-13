import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

function parseLocalDate(s: string): Date {
  return new Date(s + "T00:00:00Z");
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const cities = await prisma.tripCity.findMany({
    where: { tripId: id },
    orderBy: { targetStartDate: "asc" },
  });
  return NextResponse.json(cities);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { name, targetStartDate, targetEndDate, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const city = await prisma.tripCity.create({
    data: {
      tripId: id,
      name: name.trim(),
      targetStartDate: targetStartDate ? parseLocalDate(targetStartDate) : null,
      targetEndDate: targetEndDate ? parseLocalDate(targetEndDate) : null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(city, { status: 201 });
}
