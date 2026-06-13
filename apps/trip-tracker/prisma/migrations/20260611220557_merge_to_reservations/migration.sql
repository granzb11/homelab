-- Create ReservationType enum
CREATE TYPE "ReservationType" AS ENUM ('FLIGHT', 'HOTEL', 'AIRBNB', 'TRAIN', 'BUS', 'RENTAL_CAR', 'FOOD_TOUR', 'CITY_TOUR', 'MUSEUM', 'RESTAURANT', 'ACTIVITY', 'OTHER');

-- Create Reservation table
CREATE TABLE "Reservation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tripId" TEXT NOT NULL,
  "type" "ReservationType" NOT NULL,
  "title" TEXT NOT NULL,
  "confirmationCode" TEXT,
  "provider" TEXT,
  "startDate" TIMESTAMP(3),
  "startTime" TEXT,
  "endDate" TIMESTAMP(3),
  "endTime" TEXT,
  "startLocation" TEXT,
  "endLocation" TEXT,
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  "durationMinutes" INTEGER,
  "partySize" INTEGER,
  "price" DECIMAL(10,2),
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "notes" TEXT,
  "color" TEXT,
  "splitMode" "SplitMode" NOT NULL DEFAULT 'EVEN',
  "paidBy" TEXT NOT NULL DEFAULT '__you__',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reservation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE
);

-- Create ReservationParticipant table
CREATE TABLE "ReservationParticipant" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reservationId" TEXT NOT NULL,
  "friendId" TEXT NOT NULL,
  "inSplit" BOOLEAN NOT NULL DEFAULT true,
  "splitValue" DECIMAL(10,2),
  CONSTRAINT "ReservationParticipant_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation" ("id") ON DELETE CASCADE,
  CONSTRAINT "ReservationParticipant_reservationId_friendId_key" UNIQUE("reservationId", "friendId")
);

-- Create ReservationAttachment table
CREATE TABLE "ReservationAttachment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reservationId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReservationAttachment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation" ("id") ON DELETE CASCADE
);

-- Migrate Bookings → Reservations
INSERT INTO "Reservation" ("id", "tripId", "type", "title", "confirmationCode", "provider", "startDate", "startTime", "endDate", "endTime", "startLocation", "endLocation", "price", "currency", "notes", "color", "splitMode", "paidBy", "createdAt")
SELECT "id", "tripId", ("type")::text::"ReservationType", "title", "confirmationCode", "provider", "startDate", "startTime", "endDate", "endTime", "startLocation", "endLocation", "price", "currency", "notes", "color", "splitMode", "paidBy", "createdAt"
FROM "Booking";

-- Migrate Excursions → Reservations
INSERT INTO "Reservation" ("id", "tripId", "type", "title", "confirmationCode", "startDate", "startTime", "durationMinutes", "startLocation", "lat", "lng", "price", "currency", "notes", "splitMode", "paidBy", "createdAt")
SELECT "id", "tripId", ("type")::text::"ReservationType", "title", "confirmationCode", "date", "startTime", "durationMinutes", "location", "lat", "lng", "price", "currency", "notes", "splitMode", "paidBy", "createdAt"
FROM "Excursion";

-- Migrate BookingParticipant → ReservationParticipant
INSERT INTO "ReservationParticipant" ("id", "reservationId", "friendId", "inSplit", "splitValue")
SELECT "id", "bookingId", "friendId", "inSplit", "splitValue"
FROM "BookingParticipant";

-- Migrate ExcursionParticipant → ReservationParticipant
INSERT INTO "ReservationParticipant" ("id", "reservationId", "friendId", "inSplit", "splitValue")
SELECT "id", "excursionId", "friendId", "inSplit", "splitValue"
FROM "ExcursionParticipant";

-- Migrate BookingAttachment → ReservationAttachment
INSERT INTO "ReservationAttachment" ("id", "reservationId", "filename", "originalName", "mimeType", "createdAt")
SELECT "id", "bookingId", "filename", "originalName", "mimeType", "createdAt"
FROM "BookingAttachment";

-- Migrate ExcursionAttachment → ReservationAttachment
INSERT INTO "ReservationAttachment" ("id", "reservationId", "filename", "originalName", "mimeType", "createdAt")
SELECT "id", "excursionId", "filename", "originalName", "mimeType", "createdAt"
FROM "ExcursionAttachment";

-- Drop old tables and enums
DROP TABLE "ExcursionAttachment";
DROP TABLE "BookingAttachment";
DROP TABLE "ExcursionParticipant";
DROP TABLE "BookingParticipant";
DROP TABLE "Excursion";
DROP TABLE "Booking";
DROP TYPE "ExcursionType";
DROP TYPE "BookingType";
