-- Track Nexa schema

CREATE TABLE IF NOT EXISTS sign_up (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mobile_number VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sign_up_email ON sign_up (email);
CREATE INDEX IF NOT EXISTS idx_sign_up_mobile ON sign_up (mobile_number);

CREATE TABLE IF NOT EXISTS stations (
  id SERIAL PRIMARY KEY,
  station_code VARCHAR(10) NOT NULL UNIQUE,
  station_name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stations_name ON stations (station_name);
CREATE INDEX IF NOT EXISTS idx_stations_city ON stations (city);
CREATE INDEX IF NOT EXISTS idx_stations_code ON stations (station_code);

-- Train schedule / route stops (24hr timings)
CREATE TABLE IF NOT EXISTS train_routes (
  id SERIAL PRIMARY KEY,
  train_no VARCHAR(20),
  train_name VARCHAR(150),
  seq VARCHAR(20),
  station_code VARCHAR(20),
  station_name VARCHAR(150),
  arrival_time VARCHAR(20),
  departure_time VARCHAR(20),
  distance VARCHAR(20),
  source_station VARCHAR(20),
  source_station_name VARCHAR(150),
  destination_station VARCHAR(20),
  destination_station_name VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_train_routes_train_no ON train_routes (train_no);
CREATE INDEX IF NOT EXISTS idx_train_routes_station_code ON train_routes (station_code);

-- Coach class master (LHB capacities)
CREATE TABLE IF NOT EXISTS coach_class_master (
  class_code   VARCHAR(10) PRIMARY KEY,
  class_name   VARCHAR(100) NOT NULL,
  capacity     INTEGER NOT NULL CHECK (capacity > 0),
  berth_cycle  TEXT[] NOT NULL,
  is_seating   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS default_coach_template (
  id            SERIAL PRIMARY KEY,
  position_seq  INTEGER NOT NULL UNIQUE,
  coach_number  VARCHAR(10) NOT NULL UNIQUE,
  class_code    VARCHAR(10) NOT NULL REFERENCES coach_class_master(class_code),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS train_coaches (
  id            SERIAL PRIMARY KEY,
  train_no      VARCHAR(20) NOT NULL,
  coach_number  VARCHAR(10) NOT NULL,
  class_code    VARCHAR(10) NOT NULL REFERENCES coach_class_master(class_code),
  position_seq  INTEGER NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (train_no, coach_number),
  UNIQUE (train_no, position_seq)
);

CREATE INDEX IF NOT EXISTS idx_train_coaches_train_no ON train_coaches (train_no);

CREATE TABLE IF NOT EXISTS train_seats (
  id              SERIAL PRIMARY KEY,
  train_coach_id  INTEGER NOT NULL REFERENCES train_coaches(id) ON DELETE CASCADE,
  seat_number     VARCHAR(10) NOT NULL,
  berth_type      VARCHAR(10) NOT NULL,
  seat_seq        INTEGER NOT NULL,
  is_bookable     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (train_coach_id, seat_number),
  UNIQUE (train_coach_id, seat_seq)
);

CREATE INDEX IF NOT EXISTS idx_train_seats_coach ON train_seats (train_coach_id);

-- Segment-aware seat reservations (BOOKED / HELD)
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
  status              VARCHAR(20) NOT NULL CHECK (status IN ('HELD', 'BOOKED', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
  held_until          TIMESTAMPTZ,
  booking_ref         VARCHAR(40),
  booking_id          BIGINT,
  user_id             INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (source_seq < destination_seq)
);

CREATE INDEX IF NOT EXISTS idx_seat_res_lookup
  ON seat_reservations (train_no, journey_date, class_code, status);

-- Per-class fare rates (base + per km)
CREATE TABLE IF NOT EXISTS class_fare_rates (
  class_code     VARCHAR(10) PRIMARY KEY REFERENCES coach_class_master(class_code),
  base_fare      NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_km_rate    NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Temporary hold / booking header
CREATE TABLE IF NOT EXISTS bookings (
  id                    BIGSERIAL PRIMARY KEY,
  hold_id               VARCHAR(40) NOT NULL UNIQUE,
  pnr                   VARCHAR(10),
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
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  refund_amount         NUMERIC(10,2),
  ticket_ref            VARCHAR(24),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Payment orders (amount always from bookings.total_fare)
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

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS provider_txn_id VARCHAR(100);

