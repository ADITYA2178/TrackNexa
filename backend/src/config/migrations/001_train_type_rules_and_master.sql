-- =============================================================================
-- Train Type Classification System (SAFE)
-- Does NOT drop/alter existing train_routes columns.
-- Creates master/rules tables + classification report for review.
-- =============================================================================

BEGIN;

-- 1) Rule book: scalable keyword/regex mapping (edit this to add new types)
CREATE TABLE IF NOT EXISTS train_type_rules (
  id            SERIAL PRIMARY KEY,
  train_type    VARCHAR(40) NOT NULL,
  match_field   VARCHAR(20) NOT NULL DEFAULT 'train_name', -- train_name | train_no
  pattern       TEXT NOT NULL,          -- PostgreSQL regex (case-insensitive applied in classifier)
  priority      INTEGER NOT NULL,       -- lower = higher priority
  confidence    NUMERIC(4,3) NOT NULL CHECK (confidence > 0 AND confidence <= 1),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_train_type_rules_type_pattern
  ON train_type_rules (train_type, match_field, pattern);

-- 2) Optional IR train-number series fallback (used only when name rules miss)
CREATE TABLE IF NOT EXISTS train_number_type_ranges (
  id            SERIAL PRIMARY KEY,
  prefix_from   INTEGER NOT NULL,
  prefix_to     INTEGER NOT NULL,
  train_type    VARCHAR(40) NOT NULL,
  confidence    NUMERIC(4,3) NOT NULL CHECK (confidence > 0 AND confidence <= 1),
  notes         TEXT,
  CHECK (prefix_from <= prefix_to)
);

-- 3) Master table: one row per real train (keyed by train_no)
CREATE TABLE IF NOT EXISTS train_master (
  train_no              VARCHAR(20) PRIMARY KEY,
  train_name            VARCHAR(150),
  source_station        VARCHAR(20),
  source_station_name   VARCHAR(150),
  destination_station   VARCHAR(20),
  destination_station_name VARCHAR(150),
  train_type            VARCHAR(40),
  classification_status VARCHAR(30), -- VALID | INVALID_NAME | UNKNOWN | REVIEW
  confidence            NUMERIC(4,3),
  matched_rule_id       INTEGER REFERENCES train_type_rules(id),
  matched_by            VARCHAR(40), -- NAME_RULE | NUMBER_RANGE | INVALID_PATTERN | UNMATCHED
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) Name-level audit report (all unique train_name values)
CREATE TABLE IF NOT EXISTS train_name_classification (
  train_name            VARCHAR(150) PRIMARY KEY,
  sample_train_no       VARCHAR(20),
  train_count           INTEGER NOT NULL DEFAULT 0,
  row_count             INTEGER NOT NULL DEFAULT 0,
  train_type            VARCHAR(40),
  classification_status VARCHAR(30) NOT NULL,
  confidence            NUMERIC(4,3),
  matched_by            VARCHAR(40),
  matched_rule_id       INTEGER REFERENCES train_type_rules(id),
  data_quality_flags    TEXT[],
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed keyword rules (priority ascending)
DELETE FROM train_type_rules;
INSERT INTO train_type_rules (train_type, match_field, pattern, priority, confidence, notes) VALUES
  ('VANDE_BHARAT', 'train_name', 'VANDE|Vande Bharat|\\yVB\\y', 10, 0.980, 'Premium VB'),
  ('RAJDHANI',     'train_name', 'RAJDHANI', 20, 0.980, NULL),
  ('SHATABDI',     'train_name', 'SHATABDI', 30, 0.980, 'Includes JAN SHATABDI / TRISHATABDI text hits; refine if needed'),
  ('JANSHATABDI',  'train_name', 'JAN\\s*SHATABDI|JANSHATABDI', 25, 0.970, 'Checked before generic SHATABDI if priorities differ'),
  ('DURONTO',      'train_name', 'DURONTO', 40, 0.980, NULL),
  ('TEJAS',        'train_name', 'TEJAS', 50, 0.970, NULL),
  ('GARIBRATH',    'train_name', 'GARIB\\s*RATH|GARIBRATH|GARIB\\s*R|GARIB\\s*NAWAJ|GARIB\\s*RA', 60, 0.950, 'Truncated GARIB RATH variants'),
  ('HUMSAFAR',     'train_name', 'HUMSAFAR', 70, 0.970, NULL),
  ('YUVA',         'train_name', '\\yYUVA\\y', 80, 0.900, NULL),
  ('INTERCITY',    'train_name', 'INTER\\s*CITY|INTERCITY|INTER-CITY', 90, 0.940, NULL),
  ('MEMU',         'train_name', '\\yMEMU\\y', 100, 0.960, NULL),
  ('DMU',          'train_name', '\\yDMU\\y|\\yDEMU\\y', 110, 0.960, NULL),
  ('EMU',          'train_name', '\\yEMU\\y', 120, 0.950, NULL),
  ('SUPERFAST',    'train_name', 'SUPERFAST|\\ySF\\y|S\\s*F\\s*EXP', 130, 0.900, NULL),
  ('EXPRESS',      'train_name', 'EXPRESS|EXPRE|\\yEXPR\\y|\\yEXP\\y', 140, 0.880, 'Truncated EXPRESS forms'),
  ('PASSENGER',    'train_name', 'PASSENGER|\\yPASS\\y|\\yPAS\\y', 150, 0.880, NULL),
  ('SPECIAL',      'train_name', 'SPECIAL|\\ySPEC\\y|\\ySPL\\y', 160, 0.860, NULL);

-- Fix JANSHATABDI priority ahead of SHATABDI
UPDATE train_type_rules SET priority = 22 WHERE train_type = 'JANSHATABDI';
UPDATE train_type_rules SET priority = 30 WHERE train_type = 'SHATABDI';

DELETE FROM train_number_type_ranges;
INSERT INTO train_number_type_ranges (prefix_from, prefix_to, train_type, confidence, notes) VALUES
  (12000, 12999, 'SUPERFAST', 0.700, 'Often premium/superfast series; overridden by name rules'),
  (22000, 22999, 'SUPERFAST', 0.700, 'Duronto/SF dual series often here'),
  (20000, 21999, 'EXPRESS',   0.650, NULL),
  (10000, 11999, 'EXPRESS',   0.650, NULL),
  (13000, 19999, 'EXPRESS',   0.650, NULL),
  (11000, 11999, 'EXPRESS',   0.650, NULL),
  (90000, 99999, 'EMU',       0.750, 'Suburban / local series fallback'),
  (50000, 59999, 'PASSENGER', 0.600, 'Passenger-heavy series fallback'),
  (60000, 69999, 'PASSENGER', 0.600, NULL),
  (70000, 79999, 'PASSENGER', 0.600, NULL),
  (30000, 39999, 'PASSENGER', 0.550, NULL),
  (40000, 49999, 'PASSENGER', 0.550, NULL),
  (1, 999, 'SPECIAL', 0.500, 'Short numeric / special working');

COMMIT;
