-- Adds routeGroupId/routeLabel so a multi-stop link (e.g. a Google Maps
-- walking route) can create several Events that render as one grouped
-- "route" card in the itinerary instead of separate rows.
ALTER TABLE "Event" ADD COLUMN "routeGroupId" TEXT;
ALTER TABLE "Event" ADD COLUMN "routeLabel" TEXT;
