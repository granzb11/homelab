import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OWNER_ID, parseSplitParticipants } from "@/lib/split";
import { syncTripHangout } from "@/lib/hangout-sync";
import { fetchLinkPreview } from "@/lib/og-preview";

type Ctx = { params: Promise<{ id: string; eventId: string }> };

function parseLocalDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00Z');
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id, eventId } = await ctx.params;
  const body = await req.json();
  const {
    type, title, confirmationCode, provider,
    startDate, startTime, endDate, endTime,
    startLocation, endLocation, city, state,
    durationMinutes, partySize,
    price, currency, notes, url, splitMode, paidBy,
  } = body;

  const participants = parseSplitParticipants(body);

  let preview: { photoUrl?: string | null; previewTitle?: string | null } = {};
  if (url !== undefined) {
    const trimmedUrl = url?.trim() || null;
    const existing = await prisma.event.findUnique({ where: { id: eventId }, select: { url: true } });
    if (trimmedUrl !== (existing?.url ?? null)) {
      preview = trimmedUrl ? await fetchLinkPreview(trimmedUrl) : { photoUrl: null, previewTitle: null };
    }
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(type !== undefined && { type }),
      ...(title !== undefined && { title: title.trim() }),
      ...(confirmationCode !== undefined && { confirmationCode: confirmationCode?.trim() || null }),
      ...(provider !== undefined && { provider: provider?.trim() || null }),
      ...(startDate !== undefined && { startDate: startDate ? parseLocalDate(startDate) : null }),
      ...(startTime !== undefined && { startTime: startTime?.trim() || null }),
      ...(endDate !== undefined && { endDate: endDate ? parseLocalDate(endDate) : null }),
      ...(endTime !== undefined && { endTime: endTime?.trim() || null }),
      ...(startLocation !== undefined && { startLocation: startLocation?.trim() || null }),
      ...(endLocation !== undefined && { endLocation: endLocation?.trim() || null }),
      ...(city !== undefined && { city: city?.trim() || null }),
      ...(state !== undefined && { state: state?.trim() || null }),
      ...(durationMinutes !== undefined && { durationMinutes: durationMinutes ? parseInt(durationMinutes) : null }),
      ...(partySize !== undefined && { partySize: partySize ? parseInt(partySize) : null }),
      ...(price !== undefined && { price: price ? parseFloat(price) : null }),
      ...(currency !== undefined && { currency }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(url !== undefined && { url: url?.trim() || null, ...preview }),
      ...(splitMode !== undefined && { splitMode }),
      ...(paidBy !== undefined && { paidBy }),
      ...(participants !== null && {
        participants: {
          deleteMany: {},
          create: participants.map(({ friendId, inSplit, splitValue }) => ({ friendId, inSplit, splitValue })),
        },
      }),
    },
    include: { participants: true, attachments: true },
  });

  // Sync event participants to trip participants
  if (participants !== null && participants.length > 0) {
    const participantFriendIds = new Set(participants.map(p => p.friendId));
    participantFriendIds.add(OWNER_ID);

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

  // Sync changes to the corresponding expense
  try {
    const expenseData: Record<string, any> = {};

    if (title !== undefined) expenseData.title = title.trim();
    if (price !== undefined) expenseData.amount = price ? parseFloat(String(price)) : null;
    if (currency !== undefined) expenseData.currency = currency;
    if (startDate !== undefined) expenseData.date = startDate ? parseLocalDate(startDate) : null;
    if (notes !== undefined) expenseData.notes = notes?.trim() || null;
    if (type !== undefined) expenseData.category = type;
    if (splitMode !== undefined) expenseData.splitMode = splitMode;
    if (paidBy !== undefined) expenseData.paidBy = paidBy;

    if (participants !== null) {
      expenseData.participants = {
        deleteMany: {},
        create: participants.map((p) => ({
          friendId: p.friendId,
          inSplit: p.inSplit,
          splitValue: p.splitValue ? parseFloat(String(p.splitValue)) : null,
        })),
      };
    }

    if (Object.keys(expenseData).length > 0) {
      await prisma.expense.update({
        where: { id: eventId },
        data: expenseData,
      });
    }
  } catch (err) {
    console.error("Error syncing expense:", err);
    // Don't fail the event update if expense sync fails
  }

  await syncTripHangout(id);

  return NextResponse.json(event);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id, eventId } = await ctx.params;
  await prisma.event.delete({ where: { id: eventId } });

  // Also delete the corresponding expense
  await prisma.expense.deleteMany({ where: { id: eventId } });

  await syncTripHangout(id);
  return new NextResponse(null, { status: 204 });
}
