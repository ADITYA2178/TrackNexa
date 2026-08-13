-- Payment orders linked to booking holds

BEGIN;

CREATE TABLE IF NOT EXISTS payments (
  id              BIGSERIAL PRIMARY KEY,
  payment_id      VARCHAR(40) NOT NULL UNIQUE,
  order_id        VARCHAR(40) NOT NULL UNIQUE,
  booking_id      BIGINT NOT NULL REFERENCES bookings(id),
  hold_id         VARCHAR(40) NOT NULL,
  user_id         INTEGER,
  amount          NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency        VARCHAR(3) NOT NULL DEFAULT 'INR',
  status          VARCHAR(20) NOT NULL
                  CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  provider        VARCHAR(40) NOT NULL DEFAULT 'INTERNAL',
  failure_reason  TEXT,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_hold_id ON payments (hold_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);

-- At most one SUCCESS payment per booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_one_success_per_booking
  ON payments (booking_id)
  WHERE status = 'SUCCESS';

-- At most one active PENDING payment per booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_one_pending_per_booking
  ON payments (booking_id)
  WHERE status = 'PENDING';

COMMIT;
