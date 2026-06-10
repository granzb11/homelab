import { prisma } from "@/lib/prisma";
import { daysSince } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function GET() {
  const reminders = await prisma.reminder.findMany({
    include: {
      friend: {
        include: {
          events: { orderBy: { startDate: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const result = reminders.map((r) => {
    const lastHangout = r.friend.events[0]?.startDate ?? null;
    const days = daysSince(lastHangout);
    const isTriggered = days === null || days >= r.thresholdDays;

    return {
      id: r.id,
      thresholdDays: r.thresholdDays,
      createdAt: r.createdAt,
      friendId: r.friendId,
      friendName: r.friend.name,
      lastHangout,
      daysSinceSeen: days,
      isTriggered,
    };
  });

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { friendId, thresholdDays } = body;

  if (!friendId || !thresholdDays || thresholdDays < 1) {
    return Response.json(
      { error: "friendId and thresholdDays (≥1) are required" },
      { status: 400 }
    );
  }

  const reminder = await prisma.reminder.create({
    data: { friendId, thresholdDays: Number(thresholdDays) },
  });

  return Response.json(reminder, { status: 201 });
}
