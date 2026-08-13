-- Train → Coaches → Seats/Berths (LHB)
-- Links to existing trains via train_no only (no route duplication)

BEGIN;

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
CREATE INDEX IF NOT EXISTS idx_train_coaches_class ON train_coaches (class_code);

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
CREATE INDEX IF NOT EXISTS idx_train_seats_berth ON train_seats (berth_type);

COMMIT;
