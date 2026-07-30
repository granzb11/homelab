CREATE TYPE "RestaurantStatus" AS ENUM ('WANT_TO_GO', 'VISITED');

CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cuisine" TEXT,
    "location" TEXT,
    "url" TEXT,
    "status" "RestaurantStatus" NOT NULL DEFAULT 'WANT_TO_GO',
    "visitedWith" TEXT,
    "notes" TEXT,
    "visitedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
