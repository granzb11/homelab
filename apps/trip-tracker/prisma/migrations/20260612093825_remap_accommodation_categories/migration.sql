-- Remap HOTEL and AIRBNB to ACCOMMODATION
UPDATE "Expense"
SET "category" = 'ACCOMMODATION'
WHERE "category" IN ('HOTEL', 'AIRBNB');
