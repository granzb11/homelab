CREATE TABLE IF NOT EXISTS "EventPhoto" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "dataUrl" TEXT NOT NULL,
  "caption" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventPhoto_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EventPhoto_eventId_idx" ON "EventPhoto"("eventId");
