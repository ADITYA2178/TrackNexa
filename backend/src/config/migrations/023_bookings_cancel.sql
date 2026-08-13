-- Booking cancellation fields

BEGIN;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2);

COMMIT;
