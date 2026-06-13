-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('FLIGHT', 'HOTEL', 'AIRBNB', 'TRAIN', 'BUS', 'RENTAL_CAR', 'OTHER');

-- CreateEnum
CREATE TYPE "ExcursionType" AS ENUM ('FOOD_TOUR', 'CITY_TOUR', 'MUSEUM', 'RESTAURANT', 'ACTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "SplitMode" AS ENUM ('EVEN', 'PERCENT', 'AMOUNT');

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "destination" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "coverImageUrl" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'PLANNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripParticipant" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "joinDate" TIMESTAMP(3),
    "leaveDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "type" "BookingType" NOT NULL,
    "title" TEXT NOT NULL,
    "confirmationCode" TEXT,
    "provider" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "startLocation" TEXT,
    "endLocation" TEXT,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "splitMode" "SplitMode" NOT NULL DEFAULT 'EVEN',
    "paidBy" TEXT NOT NULL DEFAULT '__you__',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingParticipant" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "inSplit" BOOLEAN NOT NULL DEFAULT true,
    "splitValue" DECIMAL(10,2),

    CONSTRAINT "BookingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAttachment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Excursion" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "type" "ExcursionType" NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "startTime" TEXT,
    "durationMinutes" INTEGER,
    "location" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "confirmationCode" TEXT,
    "notes" TEXT,
    "splitMode" "SplitMode" NOT NULL DEFAULT 'EVEN',
    "paidBy" TEXT NOT NULL DEFAULT '__you__',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Excursion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExcursionParticipant" (
    "id" TEXT NOT NULL,
    "excursionId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "inSplit" BOOLEAN NOT NULL DEFAULT true,
    "splitValue" DECIMAL(10,2),

    CONSTRAINT "ExcursionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExcursionAttachment" (
    "id" TEXT NOT NULL,
    "excursionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExcursionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingTodo" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "bookedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingTodo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TripParticipant_tripId_friendId_key" ON "TripParticipant"("tripId", "friendId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingParticipant_bookingId_friendId_key" ON "BookingParticipant"("bookingId", "friendId");

-- CreateIndex
CREATE UNIQUE INDEX "ExcursionParticipant_excursionId_friendId_key" ON "ExcursionParticipant"("excursionId", "friendId");

-- AddForeignKey
ALTER TABLE "TripParticipant" ADD CONSTRAINT "TripParticipant_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingParticipant" ADD CONSTRAINT "BookingParticipant_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAttachment" ADD CONSTRAINT "BookingAttachment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Excursion" ADD CONSTRAINT "Excursion_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcursionParticipant" ADD CONSTRAINT "ExcursionParticipant_excursionId_fkey" FOREIGN KEY ("excursionId") REFERENCES "Excursion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcursionAttachment" ADD CONSTRAINT "ExcursionAttachment_excursionId_fkey" FOREIGN KEY ("excursionId") REFERENCES "Excursion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTodo" ADD CONSTRAINT "BookingTodo_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
