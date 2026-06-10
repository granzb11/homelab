-- Create Event table
CREATE TABLE "Event" (
  "id"          TEXT NOT NULL,
  "eventType"   TEXT,
  "location"    TEXT,
  "lat"         DOUBLE PRECISION,
  "lng"         DOUBLE PRECISION,
  "city"        TEXT,
  "startDate"   TIMESTAMP(3) NOT NULL,
  "endDate"     TIMESTAMP(3),
  "whoTraveled" TEXT,
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- Create implicit M:M join table (Prisma naming convention)
CREATE TABLE "_EventToFriend" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_EventToFriend_AB_unique" ON "_EventToFriend"("A", "B");
CREATE INDEX "_EventToFriend_B_index" ON "_EventToFriend"("B");

ALTER TABLE "_EventToFriend" ADD CONSTRAINT "_EventToFriend_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_EventToFriend" ADD CONSTRAINT "_EventToFriend_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Friend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate hangout data: deduplicate into events by (date::date, eventType, city)
INSERT INTO "Event" ("id", "eventType", "location", "lat", "lng", "city", "startDate", "whoTraveled", "notes", "createdAt")
SELECT
  gen_random_uuid()::text,
  "eventType",
  MAX("location"),
  MAX("lat"),
  MAX("lng"),
  "city",
  MIN("date"),
  MAX("whoTraveled"),
  MAX("notes"),
  MIN("createdAt")
FROM "Hangout"
GROUP BY "date"::date, "eventType", "city";

-- Populate join table
INSERT INTO "_EventToFriend" ("A", "B")
SELECT DISTINCT e."id", h."friendId"
FROM "Hangout" h
JOIN "Event" e
  ON e."startDate"::date = h."date"::date
  AND (e."eventType" IS NOT DISTINCT FROM h."eventType")
  AND (e."city" IS NOT DISTINCT FROM h."city");

-- Drop old Hangout table
DROP TABLE "Hangout";
