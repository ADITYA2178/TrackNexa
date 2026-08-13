-- Unique ticket reference for confirmed bookings

BEGIN;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS ticket_ref VARCHAR(24);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_ticket_ref
  ON bookings (ticket_ref)
  WHERE ticket_ref IS NOT NULL;

COMMIT;
