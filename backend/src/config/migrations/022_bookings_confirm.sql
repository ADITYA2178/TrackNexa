-- Confirm booking: PNR + CONFIRMED status on seat_reservations

BEGIN;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS pnr VARCHAR(10);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_pnr
  ON bookings (pnr)
  WHERE pnr IS NOT NULL;

ALTER TABLE seat_reservations
  DROP CONSTRAINT IF EXISTS seat_reservations_status_check;

ALTER TABLE seat_reservations
  ADD CONSTRAINT seat_reservations_status_check
  CHECK (status IN ('HELD', 'BOOKED', 'CONFIRMED', 'CANCELLED', 'EXPIRED'));

COMMIT;
