import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { friendAId, friendBId, type } = await request.json();

  if (!friendAId || !friendBId || !type) {
    return Response.json({ error: "friendAId, friendBId, and type are required" }, { status: 400 });
  }
  if (friendAId === friendBId) {
    return Response.json({ error: "A friend cannot have a relationship with themselves" }, { status: 400 });
  }

  const relationship = await prisma.relationship.create({
    data: { friendAId, friendBId, type },
    include: { friendA: true, friendB: true },
  });

  return Response.json(relationship, { status: 201 });
}
