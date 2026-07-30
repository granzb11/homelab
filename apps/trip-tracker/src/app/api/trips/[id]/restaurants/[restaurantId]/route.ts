import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string; restaurantId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { restaurantId } = await ctx.params;
  const body = await req.json();
  const { name, cuisine, location, url, status, visitedWith, notes, visitedAt } = body;

  const restaurant = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(cuisine !== undefined && { cuisine: cuisine?.trim() || null }),
      ...(location !== undefined && { location: location?.trim() || null }),
      ...(url !== undefined && { url: url?.trim() || null }),
      ...(status !== undefined && { status }),
      ...(visitedWith !== undefined && { visitedWith: visitedWith?.trim() || null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(visitedAt !== undefined && { visitedAt: visitedAt ? new Date(visitedAt) : null }),
    },
  });
  return NextResponse.json(restaurant);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { restaurantId } = await ctx.params;
  await prisma.restaurant.delete({ where: { id: restaurantId } });
  return new NextResponse(null, { status: 204 });
}
