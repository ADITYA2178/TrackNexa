-- Booking hold + passengers + simple class fare rates

BEGIN;

CREATE TABLE IF NOT EXISTS class_fare_rates (
  class_code     VARCHAR(10) PRIMARY KEY REFERENCES coach_class_master(class_code),
  base_fare      NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_km_rate    NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO class_fare_rates (class_code, base_fare, per_km_rate) VALUES
  ('1A', 250.00, 3.50),
  ('2A', 150.00, 2.20),
  ('3A', 100.00, 1.50),
  ('3E',  90.00, 1.30),
  ('SL',  50.00, 0.70),
  ('CC',  80.00, 1.10),
  ('EC', 120.00, 1.80),
  ('2S',  30.00, 0.40)
ON CONFLICT (class_code) DO UPDATE
SET base_fare = EXCLUDED.base_fare,
    per_km_rate = EXCLUDED.per_km_rate,
    updated_at = NOW();

CREATE TABLE IF NOT EXISTS bookings (
  id                    BIGSERIAL PRIMARY KEY,
  hold_id               VARCHAR(40) NOT NULL UNIQUE,
  train_no              VARCHAR(20) NOT NULL,
  journey_date          DATE NOT NULL,
  source_station        VARCHAR(20) NOT NULL,
  destination_station   VARCHAR(20) NOT NULL,
  source_seq            INTEGER NOT NULL,
  destination_seq       INTEGER NOT NULL,
  class_code            VARCHAR(10) NOT NULL,
  status                VARCHAR(20) NOT NULL CHECK (status IN ('HELD', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
  passenger_count       INTEGER NOT NULL CHECK (passenger_count > 0),
  distance_km           NUMERIC(10,2) NOT NULL DEFAULT 0,
  fare_per_passenger    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_fare            NUMERIC(10,2) NOT NULL DEFAULT 0,
  held_until            TIMESTAMPTZ,
  user_id               INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_hold_id ON bookings (hold_id);
CREATE INDEX IF NOT EXISTS idx_bookings_train_date ON bookings (train_no, journey_date, status);

CREATE TABLE IF NOT EXISTS booking_passengers (
  id                  BIGSERIAL PRIMARY KEY,
  booking_id          BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  passenger_seq       INTEGER NOT NULL,
  full_name           VARCHAR(150) NOT NULL,
  age                 INTEGER NOT NULL CHECK (age > 0 AND age < 130),
  gender              VARCHAR(20) NOT NULL,
  berth_preference    VARCHAR(10),
  preference_matched  BOOLEAN NOT NULL DEFAULT FALSE,
  train_seat_id       INTEGER REFERENCES train_seats(id),
  train_coach_id      INTEGER REFERENCES train_coaches(id),
  coach_number        VARCHAR(10),
  seat_number         VARCHAR(10),
  berth_type          VARCHAR(10),
  seat_reservation_id BIGINT REFERENCES seat_reservations(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, passenger_seq)
);

CREATE INDEX IF NOT EXISTS idx_booking_passengers_booking
  ON booking_passengers (booking_id);

-- Link seat_reservations back to booking hold
ALTER TABLE seat_reservations
  ADD COLUMN IF NOT EXISTS booking_id BIGINT REFERENCES bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_seat_res_booking_id
  ON seat_reservations (booking_id);

COMMIT;
