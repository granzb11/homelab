-- Rename Reservation -> Event and dependents. Uses RENAME everywhere so no
-- data is dropped/recreated (Prisma's default diff would treat this as a
-- drop+create since the model name changed, which is why this is hand-written
-- rather than generated -- see 20260611220557_merge_to_reservations for the
-- established precedent of hand-writing renames in this repo).

ALTER TYPE "ReservationType" RENAME TO "EventType";

ALTER TABLE "Reservation" RENAME TO "Event";
ALTER TABLE "ReservationParticipant" RENAME TO "EventParticipant";
ALTER TABLE "ReservationAttachment" RENAME TO "EventAttachment";

ALTER TABLE "EventParticipant" RENAME COLUMN "reservationId" TO "eventId";
ALTER TABLE "EventAttachment" RENAME COLUMN "reservationId" TO "eventId";

ALTER TABLE "Event" RENAME CONSTRAINT "Reservation_pkey" TO "Event_pkey";
ALTER TABLE "Event" RENAME CONSTRAINT "Reservation_tripId_fkey" TO "Event_tripId_fkey";

ALTER TABLE "EventParticipant" RENAME CONSTRAINT "ReservationParticipant_pkey" TO "EventParticipant_pkey";
ALTER TABLE "EventParticipant" RENAME CONSTRAINT "ReservationParticipant_reservationId_fkey" TO "EventParticipant_eventId_fkey";
ALTER INDEX "ReservationParticipant_reservationId_friendId_key" RENAME TO "EventParticipant_eventId_friendId_key";

ALTER TABLE "EventAttachment" RENAME CONSTRAINT "ReservationAttachment_pkey" TO "EventAttachment_pkey";
ALTER TABLE "EventAttachment" RENAME CONSTRAINT "ReservationAttachment_reservationId_fkey" TO "EventAttachment_eventId_fkey";

ALTER TABLE "Event" ADD COLUMN "url" TEXT;
ALTER TABLE "Event" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN "previewTitle" TEXT;

ALTER TABLE "Event" DROP COLUMN "color";
