-- Migrate all existing Reservations to Expenses
INSERT INTO "Expense" ("id", "tripId", "title", "amount", "currency", "date", "category", "notes", "splitMode", "paidBy", "createdAt")
SELECT 
  "id",
  "tripId",
  "title",
  "price",
  "currency",
  "startDate",
  "type",
  "notes",
  "splitMode",
  "paidBy",
  "createdAt"
FROM "Reservation"
WHERE "price" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "Expense" WHERE "Expense"."id" = "Reservation"."id"
  )
ON CONFLICT DO NOTHING;

-- Migrate ReservationParticipants to ExpenseParticipants
INSERT INTO "ExpenseParticipant" ("id", "expenseId", "friendId", "inSplit", "splitValue")
SELECT 
  "id",
  "reservationId",
  "friendId",
  "inSplit",
  "splitValue"
FROM "ReservationParticipant"
WHERE NOT EXISTS (
  SELECT 1 FROM "ExpenseParticipant" 
  WHERE "ExpenseParticipant"."expenseId" = "ReservationParticipant"."reservationId"
    AND "ExpenseParticipant"."friendId" = "ReservationParticipant"."friendId"
)
ON CONFLICT DO NOTHING;
