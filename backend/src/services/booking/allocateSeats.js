import { createError } from "../../utils/httpError.js"
/**
 * Lock and pick available seats for the segment.
 * Prefers matching berth_type when possible, otherwise any random free seat.
 */
const allocateSeats = async (client, {
  trainNo,
  journeyDate,
  classCode,
  sourceSeq,
  destinationSeq,
  passengers,
}) => {
  // Lock candidate seats to avoid double-hold under concurrency
  const candidates = await client.query(
    `
    SELECT
      ts.id AS train_seat_id,
      ts.seat_number,
      ts.berth_type,
      ts.seat_seq,
      tc.id AS train_coach_id,
      tc.coach_number,
      tc.position_seq
    FROM train_seats ts
    JOIN train_coaches tc ON tc.id = ts.train_coach_id
    WHERE tc.train_no = $1
      AND UPPER(tc.class_code) = UPPER($2)
      AND tc.is_active = TRUE
      AND ts.is_bookable = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM seat_reservations sr
        WHERE sr.train_seat_id = ts.id
          AND sr.journey_date = $3::date
          AND (
            sr.status IN ('BOOKED', 'CONFIRMED')
            OR (sr.status = 'HELD' AND (sr.held_until IS NULL OR sr.held_until > NOW()))
          )
          AND sr.source_seq < $5
          AND $4 < sr.destination_seq
      )
    ORDER BY random()
    FOR UPDATE OF ts SKIP LOCKED
    `,
    [trainNo, classCode, journeyDate, sourceSeq, destinationSeq],
  )

  if (candidates.rows.length < passengers.length) {
    throw createError(
      `Only ${candidates.rows.length} seats available in ${classCode} for this segment; ${passengers.length} requested`,
      409,
      { code: 'INSUFFICIENT_SEATS' },
    )
  }

  const poolSeats = [...candidates.rows]
  const allocations = []

  for (const passenger of passengers) {
    const pref = passenger.berthPreference
    let index = -1

    if (pref && pref !== 'ANY') {
      index = poolSeats.findIndex((s) => s.berth_type === pref)
    }
    if (index === -1) {
      index = 0
    }

    const [seat] = poolSeats.splice(index, 1)
    allocations.push({
      passenger,
      seat,
      preferenceMatched: Boolean(pref && pref !== 'ANY' && seat.berth_type === pref),
    })
  }

  return allocations
}

const persistHoldAllocations = async (client, {
  allocations,
  trainNo,
  journeyDate,
  normalizedClass,
  fromStop,
  toStop,
  heldUntil,
  holdId,
  bookingId,
  userId,
}) => {
  const passengerResults = []

  for (const item of allocations) {
    const reservationRes = await client.query(
      `
      INSERT INTO seat_reservations (
        train_no, journey_date, train_seat_id, train_coach_id, class_code,
        source_station, destination_station, source_seq, destination_seq,
        status, held_until, booking_ref, booking_id, user_id
      )
      VALUES (
        $1, $2::date, $3, $4, $5,
        $6, $7, $8, $9,
        'HELD', $10, $11, $12, $13
      )
      RETURNING id
      `,
      [
        trainNo, journeyDate, item.seat.train_seat_id, item.seat.train_coach_id,
        normalizedClass, fromStop.station_code, toStop.station_code,
        fromStop.seq, toStop.seq, heldUntil, holdId, bookingId, userId,
      ],
    )

    const passengerRes = await client.query(
      `
      INSERT INTO booking_passengers (
        booking_id, passenger_seq, full_name, age, gender, berth_preference,
        preference_matched, train_seat_id, train_coach_id,
        coach_number, seat_number, berth_type, seat_reservation_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
      `,
      [
        bookingId, item.passenger.seq, item.passenger.fullName,
        item.passenger.age, item.passenger.gender, item.passenger.berthPreference,
        item.preferenceMatched, item.seat.train_seat_id, item.seat.train_coach_id,
        item.seat.coach_number, item.seat.seat_number, item.seat.berth_type,
        reservationRes.rows[0].id,
      ],
    )

    const p = passengerRes.rows[0]
    passengerResults.push({
      seq: p.passenger_seq,
      fullName: p.full_name,
      age: p.age,
      gender: p.gender,
      berthPreference: p.berth_preference,
      preferenceMatched: p.preference_matched,
      allocation: {
        coachNumber: p.coach_number,
        seatNumber: p.seat_number,
        berthType: p.berth_type,
      },
    })
  }

  return passengerResults
}

export { allocateSeats, persistHoldAllocations }