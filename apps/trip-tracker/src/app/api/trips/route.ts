import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const trips = await prisma.trip.findMany({
    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { events: true, participants: true } },
      todos: { where: { bookedAt: null } },
    },
  });
  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, destination, startDate, endDate, coverImageUrl, status } = body;
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const trip = await prisma.trip.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      destination: destination?.trim() || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      coverImageUrl: coverImageUrl || null,
      status: status ?? "PLANNING",
    },
  });
  return NextResponse.json(trip, { status: 201 });
}
