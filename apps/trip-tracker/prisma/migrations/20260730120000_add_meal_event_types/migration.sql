-- Add meal-specific event types (breakfast/lunch/dinner) alongside the
-- existing generic RESTAURANT type. Values must be added one at a time and
-- cannot be used in the same transaction they're created in, which is fine
-- here since this migration only adds them.
ALTER TYPE "EventType" ADD VALUE 'BREAKFAST' AFTER 'RESTAURANT';
ALTER TYPE "EventType" ADD VALUE 'LUNCH' AFTER 'BREAKFAST';
ALTER TYPE "EventType" ADD VALUE 'DINNER' AFTER 'LUNCH';
