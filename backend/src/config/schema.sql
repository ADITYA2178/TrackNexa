-- Track Nexa: signup storage
-- Database: tracknexa (preferred over "user", which is reserved in PostgreSQL)
-- Table: sign_up

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

-- Indian railway stations (code, name, city)
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
