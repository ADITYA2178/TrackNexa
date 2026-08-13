const { query, pool } = require('../config/db')

async function findStationSeq(trainNo, station) {
  const result = await query(
    `
    SELECT CAST(seq AS INTEGER) AS seq, station_code, station_name
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

async function trainExists(trainNo) {
  const result = await query(
    `SELECT 1 FROM train_routes WHERE train_no = $1 LIMIT 1`,
    [trainNo],
  )
  return result.rowCount > 0
}

async function getClassCoaches(client, trainNo, classCode) {
  const result = await client.query(
    `
    SELECT
      tc.id AS coach_id,
      tc.coach_number,
      tc.class_code,
      tc.position_seq,
      COUNT(ts.id) FILTER (WHERE ts.is_bookable = TRUE)::int AS total_seats
    FROM train_coaches tc
    LEFT JOIN train_seats ts ON ts.train_coach_id = tc.id
    WHERE tc.train_no = $1
      AND UPPER(tc.class_code) = UPPER($2)
      AND tc.is_active = TRUE
    GROUP BY tc.id, tc.coach_number, tc.class_code, tc.position_seq
    ORDER BY tc.position_seq
    `,
    [trainNo, classCode],
  )
  return result.rows
}

/**
 * Overlap rule for open interval [source_seq, destination_seq):
 * existing.source_seq < requested.destination_seq
 * AND requested.source_seq < existing.destination_seq
 */
async function getCoachAvailability(client, {
  trainNo,
  journeyDate,
  classCode,
  sourceSeq,
  destinationSeq,
}) {
  const result = await client.query(
    `
    WITH coaches AS (
      SELECT
        tc.id AS coach_id,
        tc.coach_number,
        tc.class_code,
        tc.position_seq,
        COUNT(ts.id) FILTER (WHERE ts.is_bookable = TRUE)::int AS total_seats
      FROM train_coaches tc
      LEFT JOIN train_seats ts ON ts.train_coach_id = tc.id
      WHERE tc.train_no = $1
        AND UPPER(tc.class_code) = UPPER($2)
        AND tc.is_active = TRUE
      GROUP BY tc.id, tc.coach_number, tc.class_code, tc.position_seq
    ),
    blocked AS (
      SELECT
        sr.train_coach_id AS coach_id,
        sr.train_seat_id,
        sr.status
      FROM seat_reservations sr
      WHERE sr.train_no = $1
        AND sr.journey_date = $3::date
        AND UPPER(sr.class_code) = UPPER($2)
        AND (
          sr.status IN ('BOOKED', 'CONFIRMED')
          OR (sr.status = 'HELD' AND (sr.held_until IS NULL OR sr.held_until > NOW()))
        )
        AND sr.source_seq < $5
        AND $4 < sr.destination_seq
    )
    SELECT
      c.coach_id,
      c.coach_number,
      c.class_code,
      c.position_seq,
      c.total_seats,
      COUNT(DISTINCT b.train_seat_id) FILTER (WHERE b.status IN ('BOOKED', 'CONFIRMED'))::int AS booked_seats,
      COUNT(DISTINCT b.train_seat_id) FILTER (WHERE b.status = 'HELD')::int AS held_seats,
      GREATEST(
        c.total_seats
        - COUNT(DISTINCT b.train_seat_id) FILTER (WHERE b.status IN ('BOOKED', 'CONFIRMED', 'HELD')),
        0
      )::int AS available_seats
    FROM coaches c
    LEFT JOIN blocked b ON b.coach_id = c.coach_id
    GROUP BY c.coach_id, c.coach_number, c.class_code, c.position_seq, c.total_seats
    ORDER BY c.position_seq
    `,
    [trainNo, classCode, journeyDate, sourceSeq, destinationSeq],
  )

  return result.rows
}

module.exports = {
  pool,
  findStationSeq,
  trainExists,
  getClassCoaches,
  getCoachAvailability,
}
