import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const restaurants = await prisma.restaurant.findMany({
    where: status ? { status: status as "WANT_TO_GO" | "VISITED" } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(restaurants);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, cuisine, location, url, status, visitedWith, notes, visitedAt } = body;
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const restaurant = await prisma.restaurant.create({
    data: {
      name: name.trim(),
      cuisine: cuisine?.trim() || null,
      location: location?.trim() || null,
      url: url?.trim() || null,
      status: status ?? "WANT_TO_GO",
      visitedWith: visitedWith?.trim() || null,
      notes: notes?.trim() || null,
      visitedAt: visitedAt ? new Date(visitedAt) : null,
    },
  });
  return NextResponse.json(restaurant, { status: 201 });
}
