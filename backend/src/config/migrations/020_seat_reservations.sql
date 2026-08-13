-- Seat reservations for segment-aware availability
-- A seat is unavailable on a journey if an active reservation overlaps the segment.

BEGIN;

CREATE TABLE IF NOT EXISTS seat_reservations (
  id                  BIGSERIAL PRIMARY KEY,
  train_no            VARCHAR(20) NOT NULL,
  journey_date        DATE NOT NULL,
  train_seat_id       INTEGER NOT NULL REFERENCES train_seats(id),
  train_coach_id      INTEGER NOT NULL REFERENCES train_coaches(id),
  class_code          VARCHAR(10) NOT NULL,
  source_station      VARCHAR(20) NOT NULL,
  destination_station VARCHAR(20) NOT NULL,
  source_seq          INTEGER NOT NULL,
  destination_seq     INTEGER NOT NULL,
  status              VARCHAR(20) NOT NULL CHECK (status IN ('HELD', 'BOOKED', 'CANCELLED', 'EXPIRED')),
  held_until          TIMESTAMPTZ,
  booking_ref         VARCHAR(40),
  user_id             INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (source_seq < destination_seq)
);

CREATE INDEX IF NOT EXISTS idx_seat_res_lookup
  ON seat_reservations (train_no, journey_date, class_code, status);

CREATE INDEX IF NOT EXISTS idx_seat_res_seat_date
  ON seat_reservations (train_seat_id, journey_date, status);

CREATE INDEX IF NOT EXISTS idx_seat_res_segment
  ON seat_reservations (train_no, journey_date, source_seq, destination_seq)
  WHERE status IN ('HELD', 'BOOKED');

CREATE INDEX IF NOT EXISTS idx_seat_res_held_until
  ON seat_reservations (held_until)
  WHERE status = 'HELD';

COMMIT;
