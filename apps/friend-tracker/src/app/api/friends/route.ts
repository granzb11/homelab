import { prisma } from "@/lib/prisma";
import { daysSince } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function GET() {
  const friends = await prisma.friend.findMany({
    include: {
      events: { orderBy: { startDate: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const result = friends.map((f) => ({
    id: f.id,
    name: f.name,
    notes: f.notes,
    avatarUrl: f.avatarUrl,
    createdAt: f.createdAt,
    lastHangout: f.events[0]?.startDate ?? null,
    daysSinceSeen: daysSince(f.events[0]?.startDate),
  }));

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, notes } = body;

  if (!name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const friend = await prisma.friend.create({
    data: { name: name.trim(), notes: notes?.trim() || null },
  });

  return Response.json(friend, { status: 201 });
}
