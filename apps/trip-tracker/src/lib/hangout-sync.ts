import { prisma } from "@/lib/prisma";
import { OWNER_ID } from "@/lib/split";
import {
  createHangout,
  updateHangout,
  deleteHangout,
  type HangoutPayload,
} from "@/lib/friends";

/**
 * Mirror a trip into Friend Tracker as a single "hangout" Event.
 *
 * One Event per trip, spanning the trip's date range and attended by every trip
 * participant (minus the synthetic owner). Idempotent: the Friend Tracker event
 * id is stored on the Trip, so re-syncs update the same event instead of creating
 * duplicates. When the trip has no friends or no start date, any existing hangout
 * is deleted. Best-effort throughout — a Friend Tracker outage never throws.
 */
export async function syncTripHangout(tripId: string): Promise<void> {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { participants: true, events: true },
    });
    if (!trip) return;

    // Attendees: trip participants minus the synthetic owner, de-duped.
    const friendIds = [
      ...new Set(
        trip.participants
          .map((p) => p.friendId)
          .filter((fid) => fid !== OWNER_ID)
      ),
    ];

    // Date range: prefer the trip's own dates, otherwise derive from events.
    const resStarts = trip.events
      .map((r) => r.startDate)
      .filter((d): d is Date => d != null);
    const resEnds = trip.events
      .map((r) => r.endDate ?? r.startDate)
      .filter((d): d is Date => d != null);

    const startDate =
      trip.startDate ??
      (resStarts.length
        ? new Date(Math.min(...resStarts.map((d) => d.getTime())))
        : null);
    const endDate =
      trip.endDate ??
      (resEnds.length
        ? new Date(Math.max(...resEnds.map((d) => d.getTime())))
        : null);

    // Guard: a hangout needs at least one friend and a start date. Otherwise it
    // shouldn't exist — remove any previously synced one.
    if (friendIds.length === 0 || !startDate) {
      if (trip.hangoutEventId) {
        await deleteHangout(trip.hangoutEventId);
        await prisma.trip.update({
          where: { id: tripId },
          data: { hangoutEventId: null },
        });
      }
      return;
    }

    const notes = [trip.description?.trim(), "Synced from Trip Tracker"]
      .filter(Boolean)
      .join("\n\n");

    const payload: HangoutPayload = {
      friendIds,
      startDate: startDate.toISOString(),
      ...(endDate ? { endDate: endDate.toISOString() } : {}),
      title: trip.name,
      eventType: "Trip",
      ...(trip.destination ? { city: trip.destination } : {}),
      notes,
      whoTraveled: "Both",
    };

    if (trip.hangoutEventId) {
      const result = await updateHangout(trip.hangoutEventId, payload);
      if (result === "ok" || result === "error") return; // error: leave id, retry later
      // "missing": event was deleted in Friend Tracker — fall through to recreate.
    }

    const newId = await createHangout(payload);
    if (newId) {
      await prisma.trip.update({
        where: { id: tripId },
        data: { hangoutEventId: newId },
      });
    }
  } catch (err) {
    console.error(`[hangout-sync] failed to sync trip ${tripId}:`, err);
  }
}
