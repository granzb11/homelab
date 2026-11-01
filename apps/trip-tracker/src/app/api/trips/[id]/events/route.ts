import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OWNER_ID, parseSplitParticipants } from "@/lib/split";
import { syncTripHangout } from "@/lib/hangout-sync";
import { fetchLinkPreview } from "@/lib/og-preview";
import { parseMapsRouteUrl } from "@/lib/maps-route";

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

async function syncTripParticipants(tripId: string, participants: { friendId: string }[]) {
  if (participants.length === 0) return;
  const participantFriendIds = new Set(participants.map((p) => p.friendId));
  participantFriendIds.add(OWNER_ID); // Always include owner

  for (const friendId of participantFriendIds) {
    const existing = await prisma.tripParticipant.findUnique({
      where: { tripId_friendId: { tripId, friendId } },
    });
    if (!existing) {
      await prisma.tripParticipant.create({ data: { tripId, friendId } });
    }
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const {
    type, title, confirmationCode, provider,
    startDate, startTime, endDate, endTime,
    startLocation, endLocation, city, state,
    durationMinutes, partySize,
    price, currency, notes, url, routeGroupId, routeLabel, splitMode, paidBy,
  } = body;

  if (!type || !title?.trim()) {
    return NextResponse.json({ error: "type and title required" }, { status: 400 });
  }

  const participants = parseSplitParticipants(body) ?? [];

  // A pasted Google Maps multi-stop directions link becomes N events (one per
  // stop) sharing a routeGroupId, instead of one event with a generic OG photo --
  // the itinerary renders same-group events as a single collapsible route card.
  const routeStops = url?.trim() ? parseMapsRouteUrl(url.trim()) : null;
  if (routeStops && routeStops.length >= 2) {
    const groupId = randomUUID();
    const label = title.trim();
    const created = [];
    for (const stop of routeStops) {
      const ev = await prisma.event.create({
        data: {
          tripId: id,
          type: "ACTIVITY",
          title: stop.name,
          startDate: startDate ? parseLocalDate(startDate) : null,
          city: city?.trim() || null,
          state: state?.trim() || null,
          startLocation: stop.address,
          lat: stop.lat,
          lng: stop.lng,
          provider: "Google Maps",
          url: url.trim(),
          routeGroupId: groupId,
          routeLabel: label,
          currency: currency ?? "USD",
          splitMode: splitMode ?? "EVEN",
          paidBy: paidBy ?? OWNER_ID,
          participants: {
            create: participants.map(({ friendId, inSplit, splitValue }) => ({ friendId, inSplit, splitValue })),
          },
        },
        include: { participants: true, attachments: true },
      });
      created.push(ev);
    }

    await syncTripParticipants(id, participants);
    await syncTripHangout(id);

    return NextResponse.json({ route: true, routeGroupId: groupId, events: created }, { status: 201 });
  }

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
      routeGroupId: routeGroupId?.trim() || null,
      routeLabel: routeLabel?.trim() || null,
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

  await syncTripParticipants(id, participants);
  await syncTripHangout(id);

  return NextResponse.json(event, { status: 201 });
}
