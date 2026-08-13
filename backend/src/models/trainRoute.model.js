const { query } = require('../config/db')

async function findTrainsBetween({ from, to }) {
  const result = await query(
    `
    SELECT
      f.train_no,
      f.train_name,
      f.station_code AS from_station_code,
      f.station_name AS from_station_name,
      f.departure_time,
      CAST(f.seq AS INTEGER) AS from_seq,
      CAST(NULLIF(TRIM(f.distance), '') AS NUMERIC) AS from_distance,
      t.station_code AS to_station_code,
      t.station_name AS to_station_name,
      t.arrival_time,
      CAST(t.seq AS INTEGER) AS to_seq,
      CAST(NULLIF(TRIM(t.distance), '') AS NUMERIC) AS to_distance,
      GREATEST(
        CAST(NULLIF(TRIM(t.distance), '') AS NUMERIC)
        - CAST(NULLIF(TRIM(f.distance), '') AS NUMERIC),
        0
      ) AS distance,
      f.source_station,
      f.source_station_name,
      f.destination_station,
      f.destination_station_name
    FROM train_routes f
    INNER JOIN train_routes t
      ON f.train_no = t.train_no
    WHERE (
        UPPER(f.station_code) = UPPER($1)
        OR LOWER(f.station_name) = LOWER($1)
      )
      AND (
        UPPER(t.station_code) = UPPER($2)
        OR LOWER(t.station_name) = LOWER($2)
      )
      AND CAST(f.seq AS INTEGER) < CAST(t.seq AS INTEGER)
    ORDER BY f.departure_time ASC, f.train_no ASC
    `,
    [from, to],
  )

  return result.rows
}

async function findStationOnTrain(trainNo, station) {
  const result = await query(
    `
    SELECT
      train_no,
      train_name,
      station_code,
      station_name,
      arrival_time,
      departure_time,
      CAST(seq AS INTEGER) AS seq,
      CAST(NULLIF(TRIM(distance), '') AS NUMERIC) AS distance
    FROM train_routes
    WHERE train_no = $1
      AND (
        UPPER(station_code) = UPPER($2)
        OR LOWER(station_name) = LOWER($2)
      )
    ORDER BY CAST(seq AS INTEGER) ASC
    LIMIT 1
    `,
    [trainNo, station],
  )

  return result.rows[0] || null
}

async function findStopsBetween({ trainNo, fromSeq, toSeq }) {
  const result = await query(
    `
    SELECT
      train_no,
      train_name,
      station_code,
      station_name,
      arrival_time,
      departure_time,
      CAST(seq AS INTEGER) AS seq,
      CAST(NULLIF(TRIM(distance), '') AS NUMERIC) AS distance
    FROM train_routes
    WHERE train_no = $1
      AND CAST(seq AS INTEGER) >= $2
      AND CAST(seq AS INTEGER) <= $3
    ORDER BY CAST(seq AS INTEGER) ASC
    `,
    [trainNo, fromSeq, toSeq],
  )

  return result.rows
}

async function trainExists(trainNo) {
  const result = await query(
    `SELECT 1 FROM train_routes WHERE train_no = $1 LIMIT 1`,
    [trainNo],
  )
  return result.rowCount > 0
}

module.exports = {
  findTrainsBetween,
  findStationOnTrain,
  findStopsBetween,
  trainExists,
}
