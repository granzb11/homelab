import { prisma } from "@/lib/prisma";
import { daysSince } from "@/lib/utils";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  const friend = await prisma.friend.findUnique({
    where: { id },
    include: {
      events: { orderBy: { startDate: "desc" } },
      reminders: true,
      relationshipsAs: { include: { friendB: true } },
      relationshipsAs2: { include: { friendA: true } },
    },
  });

  if (!friend) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const relationships = [
    ...friend.relationshipsAs.map((r) => ({ id: r.id, type: r.type, friend: { id: r.friendB.id, name: r.friendB.name, avatarUrl: r.friendB.avatarUrl } })),
    ...friend.relationshipsAs2.map((r) => ({ id: r.id, type: r.type, friend: { id: r.friendA.id, name: r.friendA.name, avatarUrl: r.friendA.avatarUrl } })),
  ];

  return Response.json({
    ...friend,
    relationships,
    lastHangout: friend.events[0]?.startDate ?? null,
    daysSinceSeen: daysSince(friend.events[0]?.startDate),
  });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { name, notes, avatarUrl } = body;

  const friend = await prisma.friend.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
    },
  });

  return Response.json(friend);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.friend.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
