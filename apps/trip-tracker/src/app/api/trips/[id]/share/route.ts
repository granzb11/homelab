import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { shareToken: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (!trip.shareToken) {
      return NextResponse.json(
        { error: "Share link not generated" },
        { status: 404 }
      );
    }

    return NextResponse.json({ shareToken: trip.shareToken });
  } catch (error) {
    console.error("GET /api/trips/[id]/share error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { shareToken: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // If token already exists, return it; otherwise generate a new one
    let shareToken = trip.shareToken;
    if (!shareToken) {
      shareToken = generateShareToken();
      await prisma.trip.update({
        where: { id },
        data: { shareToken },
      });
    }

    return NextResponse.json({ shareToken });
  } catch (error) {
    console.error("POST /api/trips/[id]/share error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
