CREATE TABLE "TripCity" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "targetStartDate" TIMESTAMP(3),
  "targetEndDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TripCity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TripCity" ADD CONSTRAINT "TripCity_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
