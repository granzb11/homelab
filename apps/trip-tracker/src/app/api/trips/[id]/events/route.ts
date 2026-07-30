import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OWNER_ID, parseSplitParticipants } from "@/lib/split";
import { syncTripHangout } from "@/lib/hangout-sync";
import { fetchLinkPreview } from "@/lib/og-preview";

type Ctx = { params: Promise<{ id: string }> };

function parseLocalDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00Z');
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const events = await prisma.event.findMany({
    where: { tripId: id },
    include: { participants: true, attachments: true },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const {
    type, title, confirmationCode, provider,
    startDate, startTime, endDate, endTime,
    startLocation, endLocation, city, state,
    durationMinutes, partySize,
    price, currency, notes, url, splitMode, paidBy,
  } = body;

  if (!type || !title?.trim()) {
    return NextResponse.json({ error: "type and title required" }, { status: 400 });
  }

  const participants = parseSplitParticipants(body) ?? [];
  const preview = url?.trim() ? await fetchLinkPreview(url.trim()) : { photoUrl: null, previewTitle: null };

  const event = await prisma.event.create({
    data: {
      tripId: id,
      type,
      title: title.trim(),
      confirmationCode: confirmationCode?.trim() || null,
      provider: provider?.trim() || null,
      startDate: startDate ? parseLocalDate(startDate) : null,
      startTime: startTime?.trim() || null,
      endDate: endDate ? parseLocalDate(endDate) : null,
      endTime: endTime?.trim() || null,
      startLocation: startLocation?.trim() || null,
      endLocation: endLocation?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      partySize: partySize ? parseInt(partySize) : null,
      price: price ? parseFloat(price) : null,
      currency: currency ?? "USD",
      notes: notes?.trim() || null,
      url: url?.trim() || null,
      ...preview,
      splitMode: splitMode ?? "EVEN",
      paidBy: paidBy ?? OWNER_ID,
      participants: {
        create: participants.map(({ friendId, inSplit, splitValue }) => ({ friendId, inSplit, splitValue })),
      },
    },
    include: { participants: true, attachments: true },
  });

  // Create corresponding expense for the event
  if (price) {
    await prisma.expense.create({
      data: {
        id: event.id,
        tripId: id,
        title: title.trim(),
        amount: parseFloat(String(price)),
        currency: currency ?? "USD",
        date: startDate ? parseLocalDate(startDate) : null,
        category: type,
        notes: notes?.trim() || null,
        splitMode: splitMode ?? "EVEN",
        paidBy: paidBy ?? OWNER_ID,
        participants: {
          create: participants.map(({ friendId, inSplit, splitValue }) => ({ friendId, inSplit, splitValue })),
        },
      },
    }).catch(() => {
      // Expense might already exist (from migration), ignore error
    });
  }

  // Add event participants as trip participants
  if (participants.length > 0) {
    const participantFriendIds = new Set(participants.map(p => p.friendId));
    participantFriendIds.add(OWNER_ID); // Always include owner

    for (const friendId of participantFriendIds) {
      const existing = await prisma.tripParticipant.findUnique({
        where: { tripId_friendId: { tripId: id, friendId } },
      });
      if (!existing) {
        await prisma.tripParticipant.create({
          data: { tripId: id, friendId },
        });
      }
    }
  }

  await syncTripHangout(id);

  return NextResponse.json(event, { status: 201 });
}
