const crypto = require('crypto')
const { pool } = require('../config/db')

const HOLD_MINUTES = 10

const ALLOWED_CLASSES = new Set([
  '1A',
  '2A',
  '3A',
  '3E',
  'SL',
  'CC',
  'EC',
  '2S',
])

const ALLOWED_GENDERS = new Set(['MALE', 'FEMALE', 'OTHER', 'M', 'F', 'O'])

const BERTH_PREFS = new Set([
  'LB',
  'MB',
  'UB',
  'SL',
  'SU',
  'WS',
  'AS',
  'SEAT',
  'ANY',
  'NONE',
])

function createError(message, status, extra = {}) {
  const error = new Error(message)
  error.status = status
  Object.assign(error, extra)
  return error
}

function isValidDate(date) {
  if (!date || typeof date !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(`${date}T00:00:00`)
  return !Number.isNaN(parsed.getTime())
}

function normalizeGender(gender) {
  const g = String(gender || '')
    .trim()
    .toUpperCase()
  if (g === 'M') return 'MALE'
  if (g === 'F') return 'FEMALE'
  if (g === 'O') return 'OTHER'
  return g
}

function normalizePreference(pref) {
  const value = String(pref || 'ANY')
    .trim()
    .toUpperCase()
  if (!value || value === 'NONE') return 'ANY'
  return value
}

function generateHoldId() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `HLD-${stamp}-${rand}`
}

async function findStationSeq(client, trainNo, station) {
  const result = await client.query(
    `
    SELECT CAST(seq AS INTEGER) AS seq, station_code, station_name,
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

async function getFareRate(client, classCode) {
  const result = await client.query(
    `
    SELECT base_fare, per_km_rate
    FROM class_fare_rates
    WHERE class_code = $1
    `,
    [classCode],
  )
  return result.rows[0] || { base_fare: 0, per_km_rate: 0 }
}

function calculateFare(distanceKm, baseFare, perKmRate) {
  const distance = Math.max(Number(distanceKm) || 0, 0)
  const fare = Number(baseFare) + distance * Number(perKmRate)
  return Math.round(fare * 100) / 100
}

/**
 * Lock and pick available seats for the segment.
 * Prefers matching berth_type when possible, otherwise any random free seat.
 */
async function allocateSeats(client, {
  trainNo,
  journeyDate,
  classCode,
  sourceSeq,
  destinationSeq,
  passengers,
}) {
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

async function createSeatHold({
  trainId,
  journeyDate,
  sourceStation,
  destinationStation,
  classCode,
  passengers,
  userId = null,
}) {
  if (
    !trainId ||
    !journeyDate ||
    !sourceStation ||
    !destinationStation ||
    !classCode ||
    !Array.isArray(passengers) ||
    passengers.length === 0
  ) {
    throw createError(
      'trainId, journeyDate, sourceStation, destinationStation, classCode, and passengers[] are required',
      400,
    )
  }

  if (!isValidDate(journeyDate)) {
    throw createError('journeyDate must be in YYYY-MM-DD format', 400)
  }

  const normalizedClass = String(classCode).trim().toUpperCase()
  if (!ALLOWED_CLASSES.has(normalizedClass)) {
    throw createError(
      `Invalid classCode. Allowed: ${[...ALLOWED_CLASSES].join(', ')}`,
      400,
    )
  }

  if (passengers.length > 6) {
    throw createError('Maximum 6 passengers allowed per hold', 400)
  }

  const normalizedPassengers = passengers.map((p, idx) => {
    const fullName = String(p.fullName || p.name || '').trim()
    const age = Number(p.age)
    const gender = normalizeGender(p.gender)
    const berthPreference = normalizePreference(p.berthPreference)

    if (!fullName) {
      throw createError(`Passenger ${idx + 1}: name is required`, 400)
    }
    if (!Number.isInteger(age) || age <= 0 || age >= 130) {
      throw createError(`Passenger ${idx + 1}: valid age is required`, 400)
    }
    if (!ALLOWED_GENDERS.has(gender) && !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      throw createError(
        `Passenger ${idx + 1}: gender must be MALE, FEMALE, or OTHER`,
        400,
      )
    }
    if (!BERTH_PREFS.has(berthPreference)) {
      throw createError(
        `Passenger ${idx + 1}: invalid berthPreference`,
        400,
      )
    }

    return {
      fullName,
      age,
      gender,
      berthPreference,
      seq: idx + 1,
    }
  })

  const trainNo = String(trainId).trim()
  const source = String(sourceStation).trim()
  const destination = String(destinationStation).trim()

  if (source.toUpperCase() === destination.toUpperCase()) {
    throw createError('sourceStation and destinationStation must be different', 400)
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const trainCheck = await client.query(
      `SELECT 1 FROM train_routes WHERE train_no = $1 LIMIT 1`,
      [trainNo],
    )
    if (!trainCheck.rowCount) {
      throw createError(`Train ${trainNo} not found`, 404)
    }

    const classCheck = await client.query(
      `
      SELECT COUNT(*)::int AS coaches
      FROM train_coaches
      WHERE train_no = $1 AND UPPER(class_code) = $2 AND is_active = TRUE
      `,
      [trainNo, normalizedClass],
    )
    if (!classCheck.rows[0].coaches) {
      throw createError(
        `Class ${normalizedClass} is not available on train ${trainNo}`,
        404,
        { code: 'CLASS_NOT_AVAILABLE' },
      )
    }

    const fromStop = await findStationSeq(client, trainNo, source)
    if (!fromStop) {
      throw createError(
        `Source station "${source}" not found on train ${trainNo}`,
        404,
      )
    }
    const toStop = await findStationSeq(client, trainNo, destination)
    if (!toStop) {
      throw createError(
        `Destination station "${destination}" not found on train ${trainNo}`,
        404,
      )
    }
    if (fromStop.seq >= toStop.seq) {
      throw createError(
        'Destination comes before source on this train route',
        400,
      )
    }

    const distanceKm = Math.max(
      Number(toStop.distance || 0) - Number(fromStop.distance || 0),
      0,
    )
    const rate = await getFareRate(client, normalizedClass)
    const farePerPassenger = calculateFare(
      distanceKm,
      rate.base_fare,
      rate.per_km_rate,
    )
    const totalFare =
      Math.round(farePerPassenger * normalizedPassengers.length * 100) / 100

    const allocations = await allocateSeats(client, {
      trainNo,
      journeyDate,
      classCode: normalizedClass,
      sourceSeq: fromStop.seq,
      destinationSeq: toStop.seq,
      passengers: normalizedPassengers,
    })

    const holdId = generateHoldId()
    const heldUntilRes = await client.query(
      `SELECT NOW() + ($1 || ' minutes')::interval AS held_until`,
      [String(HOLD_MINUTES)],
    )
    const heldUntil = heldUntilRes.rows[0].held_until

    const bookingRes = await client.query(
      `
      INSERT INTO bookings (
        hold_id, train_no, journey_date,
        source_station, destination_station, source_seq, destination_seq,
        class_code, status, passenger_count,
        distance_km, fare_per_passenger, total_fare,
        held_until, user_id
      )
      VALUES (
        $1, $2, $3::date,
        $4, $5, $6, $7,
        $8, 'HELD', $9,
        $10, $11, $12,
        $13, $14
      )
      RETURNING *
      `,
      [
        holdId,
        trainNo,
        journeyDate,
        fromStop.station_code,
        toStop.station_code,
        fromStop.seq,
        toStop.seq,
        normalizedClass,
        normalizedPassengers.length,
        distanceKm,
        farePerPassenger,
        totalFare,
        heldUntil,
        userId,
      ],
    )
    const booking = bookingRes.rows[0]

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
          trainNo,
          journeyDate,
          item.seat.train_seat_id,
          item.seat.train_coach_id,
          normalizedClass,
          fromStop.station_code,
          toStop.station_code,
          fromStop.seq,
          toStop.seq,
          heldUntil,
          holdId,
          booking.id,
          userId,
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
          booking.id,
          item.passenger.seq,
          item.passenger.fullName,
          item.passenger.age,
          item.passenger.gender,
          item.passenger.berthPreference,
          item.preferenceMatched,
          item.seat.train_seat_id,
          item.seat.train_coach_id,
          item.seat.coach_number,
          item.seat.seat_number,
          item.seat.berth_type,
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

    await client.query('COMMIT')

    return {
      holdId: booking.hold_id,
      bookingId: Number(booking.id),
      status: booking.status,
      trainId: booking.train_no,
      journeyDate: journeyDate,
      sourceStation: {
        code: fromStop.station_code,
        name: fromStop.station_name,
        seq: fromStop.seq,
      },
      destinationStation: {
        code: toStop.station_code,
        name: toStop.station_name,
        seq: toStop.seq,
      },
      classCode: normalizedClass,
      heldUntil: booking.held_until,
      holdExpiresInMinutes: HOLD_MINUTES,
      passengers: passengerResults,
      fare: {
        distanceKm,
        currency: 'INR',
        perPassenger: farePerPassenger,
        passengerCount: normalizedPassengers.length,
        totalFare,
        breakdown: {
          baseFare: Number(rate.base_fare),
          perKmRate: Number(rate.per_km_rate),
        },
      },
      message: `Seats held for ${HOLD_MINUTES} minutes. Complete payment before hold expires.`,
    }
  } catch (err) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // ignore
    }
    throw err
  } finally {
    client.release()
  }
}

function generatePnr() {
  // Unique 10-digit PNR (leading digit 1–9)
  return String(crypto.randomInt(1_000_000_000, 10_000_000_000))
}

function formatPgDate(value) {
  if (!value) return null
  if (typeof value === 'string') return value.slice(0, 10)
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function getTrainName(client, trainNo) {
  const result = await client.query(
    `
    SELECT train_name
    FROM train_routes
    WHERE train_no = $1
    ORDER BY CAST(seq AS INTEGER) ASC
    LIMIT 1
    `,
    [trainNo],
  )
  return result.rows[0]?.train_name || null
}

async function insertUniquePnr(client, bookingId) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const pnr = generatePnr()
    try {
      const result = await client.query(
        `
        UPDATE bookings
        SET pnr = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING pnr
        `,
        [pnr, bookingId],
      )
      return result.rows[0].pnr
    } catch (err) {
      if (err.code === '23505') continue // unique_violation — retry
      throw err
    }
  }
  throw createError('Unable to generate unique PNR', 500, { code: 'PNR_GENERATION_FAILED' })
}

async function loadPassengers(client, bookingId) {
  const passengersRes = await client.query(
    `
    SELECT
      passenger_seq,
      full_name,
      age,
      gender,
      berth_preference,
      preference_matched,
      coach_number,
      seat_number,
      berth_type
    FROM booking_passengers
    WHERE booking_id = $1
    ORDER BY passenger_seq ASC
    `,
    [bookingId],
  )
  return passengersRes.rows
}

function mapTicketResponse(booking, { pnr, trainName, passengers }) {
  return {
    pnr,
    bookingId: Number(booking.id),
    holdId: booking.hold_id,
    status: 'CONFIRMED',
    train: {
      trainNo: booking.train_no,
      trainName,
    },
    journey: {
      journeyDate: formatPgDate(booking.journey_date),
      sourceStation: booking.source_station,
      destinationStation: booking.destination_station,
      sourceSeq: booking.source_seq,
      destinationSeq: booking.destination_seq,
      classCode: booking.class_code,
      distanceKm: Number(booking.distance_km),
    },
    classCode: booking.class_code,
    passengers: passengers.map((p) => ({
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
    })),
    fare: {
      currency: 'INR',
      perPassenger: Number(booking.fare_per_passenger),
      passengerCount: booking.passenger_count,
      totalFare: Number(booking.total_fare),
    },
    totalFare: Number(booking.total_fare),
    message: 'Booking confirmed successfully',
  }
}

/**
 * Confirm a locked HELD booking inside an open transaction.
 * Caller must BEGIN and FOR UPDATE the booking row.
 */
async function confirmHeldBookingInTx(client, booking) {
  if (booking.status === 'CONFIRMED' && booking.pnr) {
    const trainName = await getTrainName(client, booking.train_no)
    const passengers = await loadPassengers(client, booking.id)
    return mapTicketResponse(booking, {
      pnr: booking.pnr,
      trainName,
      passengers,
    })
  }

  if (booking.status !== 'HELD') {
    throw createError(`Booking status "${booking.status}" cannot be confirmed`, 409, {
      code: 'INVALID_BOOKING_STATUS',
    })
  }

  const expiryCheck = await client.query(
    `
    SELECT (held_until IS NOT NULL AND held_until <= NOW()) AS is_expired
    FROM bookings
    WHERE id = $1
    `,
    [booking.id],
  )

  if (expiryCheck.rows[0]?.is_expired === true) {
    await client.query(
      `
      UPDATE bookings
      SET status = 'EXPIRED', updated_at = NOW()
      WHERE id = $1
      `,
      [booking.id],
    )
    await client.query(
      `
      UPDATE seat_reservations
      SET status = 'EXPIRED', updated_at = NOW()
      WHERE booking_id = $1 AND status = 'HELD'
      `,
      [booking.id],
    )
    const err = createError('Hold has expired and cannot be confirmed', 410, {
      code: 'HOLD_EXPIRED',
    })
    err.holdExpiredInTx = true
    throw err
  }

  const reservationUpdate = await client.query(
    `
    UPDATE seat_reservations
    SET status = 'CONFIRMED',
        held_until = NULL,
        updated_at = NOW()
    WHERE booking_id = $1
      AND status = 'HELD'
    RETURNING id
    `,
    [booking.id],
  )

  if (!reservationUpdate.rowCount) {
    throw createError('No active held seats found for this booking', 409, {
      code: 'NO_HELD_SEATS',
    })
  }

  await client.query(
    `
    UPDATE bookings
    SET status = 'CONFIRMED',
        held_until = NULL,
        updated_at = NOW()
    WHERE id = $1
    `,
    [booking.id],
  )

  const pnr = booking.pnr || (await insertUniquePnr(client, booking.id))
  const trainName = await getTrainName(client, booking.train_no)
  const passengers = await loadPassengers(client, booking.id)

  return mapTicketResponse(
    { ...booking, status: 'CONFIRMED', pnr },
    { pnr, trainName, passengers },
  )
}

async function getConfirmedTicketByBookingId(client, bookingId) {
  const bookingRes = await client.query(
    `SELECT * FROM bookings WHERE id = $1`,
    [bookingId],
  )
  if (!bookingRes.rowCount) {
    throw createError('Booking not found', 404, { code: 'BOOKING_NOT_FOUND' })
  }
  const booking = bookingRes.rows[0]
  const trainName = await getTrainName(client, booking.train_no)
  const passengers = await loadPassengers(client, booking.id)
  return mapTicketResponse(booking, {
    pnr: booking.pnr,
    trainName,
    passengers,
  })
}

async function confirmSeatHold({ holdId, userId = null }) {
  if (!holdId || typeof holdId !== 'string' || !holdId.trim()) {
    throw createError('holdId is required', 400)
  }

  const normalizedHoldId = holdId.trim()
  const client = await pool.connect()
  let committed = false

  try {
    await client.query('BEGIN')

    const bookingRes = await client.query(
      `
      SELECT *
      FROM bookings
      WHERE hold_id = $1
      FOR UPDATE
      `,
      [normalizedHoldId],
    )

    if (!bookingRes.rowCount) {
      throw createError(`Hold "${normalizedHoldId}" not found`, 404, {
        code: 'HOLD_NOT_FOUND',
      })
    }

    const booking = bookingRes.rows[0]

    if (
      userId != null &&
      booking.user_id != null &&
      Number(userId) !== Number(booking.user_id)
    ) {
      throw createError('Hold does not belong to this user', 403, {
        code: 'HOLD_USER_MISMATCH',
      })
    }

    if (booking.status === 'CONFIRMED') {
      throw createError('Booking is already confirmed', 409, {
        code: 'ALREADY_CONFIRMED',
        pnr: booking.pnr,
        bookingId: Number(booking.id),
      })
    }

    if (booking.status === 'CANCELLED') {
      throw createError('Booking has been cancelled and cannot be confirmed', 409, {
        code: 'BOOKING_CANCELLED',
      })
    }

    if (booking.status === 'EXPIRED') {
      throw createError('Hold has expired and cannot be confirmed', 410, {
        code: 'HOLD_EXPIRED',
      })
    }

    if (booking.status !== 'HELD') {
      throw createError(`Booking status "${booking.status}" cannot be confirmed`, 409, {
        code: 'INVALID_BOOKING_STATUS',
      })
    }

    const ticket = await confirmHeldBookingInTx(client, booking)
    await client.query('COMMIT')
    committed = true
    return ticket
  } catch (err) {
    if (!committed) {
      if (err.holdExpiredInTx) {
        try {
          await client.query('COMMIT')
          committed = true
        } catch {
          try {
            await client.query('ROLLBACK')
          } catch {
            // ignore
          }
        }
      } else {
        try {
          await client.query('ROLLBACK')
        } catch {
          // ignore
        }
      }
    }
    throw err
  } finally {
    client.release()
  }
}

function statusLabel(status) {
  switch (status) {
    case 'CONFIRMED':
      return 'Booking is confirmed and valid'
    case 'CANCELLED':
      return 'Booking has been cancelled'
    case 'EXPIRED':
      return 'Booking/hold has expired'
    case 'HELD':
      return 'Seats are temporarily held (not yet confirmed)'
    default:
      return `Booking status: ${status}`
  }
}

async function getBookingByPnr(pnr) {
  const normalized = String(pnr || '').trim()

  if (!/^\d{10}$/.test(normalized)) {
    throw createError('PNR must be a 10-digit number', 400, {
      code: 'INVALID_PNR',
    })
  }

  const bookingRes = await pool.query(
    `
    SELECT
      b.id,
      b.pnr,
      b.train_no,
      b.journey_date,
      b.source_station,
      b.destination_station,
      b.source_seq,
      b.destination_seq,
      b.class_code,
      b.status,
      b.passenger_count,
      b.distance_km,
      b.fare_per_passenger,
      b.total_fare,
      b.created_at,
      b.updated_at,
      (
        SELECT tr.train_name
        FROM train_routes tr
        WHERE tr.train_no = b.train_no
        ORDER BY CAST(tr.seq AS INTEGER) ASC
        LIMIT 1
      ) AS train_name,
      (
        SELECT tr.station_name
        FROM train_routes tr
        WHERE tr.train_no = b.train_no
          AND UPPER(tr.station_code) = UPPER(b.source_station)
        ORDER BY CAST(tr.seq AS INTEGER) ASC
        LIMIT 1
      ) AS source_station_name,
      (
        SELECT tr.station_name
        FROM train_routes tr
        WHERE tr.train_no = b.train_no
          AND UPPER(tr.station_code) = UPPER(b.destination_station)
        ORDER BY CAST(tr.seq AS INTEGER) ASC
        LIMIT 1
      ) AS destination_station_name
    FROM bookings b
    WHERE b.pnr = $1
    `,
    [normalized],
  )

  if (!bookingRes.rowCount) {
    throw createError(`PNR ${normalized} not found`, 404, {
      code: 'PNR_NOT_FOUND',
    })
  }

  const booking = bookingRes.rows[0]

  // PNRs are issued only after confirm; still surface CANCELLED/EXPIRED clearly
  if (!['CONFIRMED', 'CANCELLED', 'EXPIRED'].includes(booking.status)) {
    throw createError(`PNR ${normalized} not found`, 404, {
      code: 'PNR_NOT_FOUND',
    })
  }

  const passengersRes = await pool.query(
    `
    SELECT
      passenger_seq,
      full_name,
      age,
      gender,
      berth_preference,
      preference_matched,
      coach_number,
      seat_number,
      berth_type
    FROM booking_passengers
    WHERE booking_id = $1
    ORDER BY passenger_seq ASC
    `,
    [booking.id],
  )

  return {
    pnr: booking.pnr,
    bookingId: Number(booking.id),
    status: booking.status,
    statusMessage: statusLabel(booking.status),
    isActive: booking.status === 'CONFIRMED',
    train: {
      trainNo: booking.train_no,
      trainName: booking.train_name,
    },
    journey: {
      journeyDate: formatPgDate(booking.journey_date),
      sourceStation: {
        code: booking.source_station,
        name: booking.source_station_name,
      },
      destinationStation: {
        code: booking.destination_station,
        name: booking.destination_station_name,
      },
      classCode: booking.class_code,
      distanceKm: Number(booking.distance_km),
    },
    classCode: booking.class_code,
    passengers: passengersRes.rows.map((p) => ({
      seq: p.passenger_seq,
      fullName: p.full_name,
      age: p.age,
      gender: p.gender,
      berthPreference: p.berth_preference,
      allocation: {
        coachNumber: p.coach_number,
        seatNumber: p.seat_number,
        berthType: p.berth_type,
      },
    })),
    fare: {
      currency: 'INR',
      perPassenger: Number(booking.fare_per_passenger),
      passengerCount: booking.passenger_count,
      totalFare: Number(booking.total_fare),
    },
    totalFare: Number(booking.total_fare),
    bookedAt: booking.created_at,
    updatedAt: booking.updated_at,
  }
}

/**
 * Refund policy (based on hours until journey date start of day):
 *  >= 48h  → 100%
 *  >= 12h  → 75%
 *  >= 4h   → 50%
 *  else    → 0% (still allow cancel before journey day ends)
 * Past journey date → cannot cancel
 */
function calculateRefund(totalFare, journeyDate) {
  const fare = Math.max(Number(totalFare) || 0, 0)
  const journey = journeyDate instanceof Date
    ? new Date(journeyDate.getFullYear(), journeyDate.getMonth(), journeyDate.getDate())
    : new Date(`${formatPgDate(journeyDate)}T00:00:00`)

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (journey < startOfToday) {
    return {
      allowed: false,
      refundAmount: 0,
      refundPercent: 0,
      policy: 'JOURNEY_STARTED',
    }
  }

  const hoursUntil = (journey.getTime() - now.getTime()) / (1000 * 60 * 60)
  let refundPercent = 0
  let policy = 'WITHIN_4H'

  if (hoursUntil >= 48) {
    refundPercent = 100
    policy = 'GE_48H'
  } else if (hoursUntil >= 12) {
    refundPercent = 75
    policy = 'GE_12H'
  } else if (hoursUntil >= 4) {
    refundPercent = 50
    policy = 'GE_4H'
  }

  const refundAmount = Math.round(((fare * refundPercent) / 100) * 100) / 100

  return {
    allowed: true,
    refundAmount,
    refundPercent,
    policy,
    hoursUntil: Math.round(hoursUntil * 10) / 10,
  }
}

async function cancelBookingByPnr({
  pnr,
  userId = null,
  reason = 'USER_REQUESTED',
}) {
  const normalized = String(pnr || '').trim()

  if (!/^\d{10}$/.test(normalized)) {
    throw createError('PNR must be a 10-digit number', 400, {
      code: 'INVALID_PNR',
    })
  }

  const cancellationReason = String(reason || 'USER_REQUESTED').trim().slice(0, 500)
    || 'USER_REQUESTED'

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const bookingRes = await client.query(
      `
      SELECT *
      FROM bookings
      WHERE pnr = $1
      FOR UPDATE
      `,
      [normalized],
    )

    if (!bookingRes.rowCount) {
      throw createError(`PNR ${normalized} not found`, 404, {
        code: 'PNR_NOT_FOUND',
      })
    }

    const booking = bookingRes.rows[0]

    if (
      userId != null &&
      booking.user_id != null &&
      Number(userId) !== Number(booking.user_id)
    ) {
      throw createError('Booking does not belong to this user', 403, {
        code: 'BOOKING_USER_MISMATCH',
      })
    }

    if (booking.status === 'CANCELLED') {
      throw createError('Booking is already cancelled', 409, {
        code: 'ALREADY_CANCELLED',
        cancelledAt: booking.cancelled_at,
        refundAmount: booking.refund_amount != null
          ? Number(booking.refund_amount)
          : undefined,
      })
    }

    if (booking.status === 'EXPIRED') {
      throw createError('Expired bookings cannot be cancelled', 409, {
        code: 'BOOKING_EXPIRED',
      })
    }

    if (booking.status === 'HELD') {
      throw createError('Held bookings cannot be cancelled via PNR; confirm or let the hold expire', 409, {
        code: 'BOOKING_NOT_CONFIRMED',
      })
    }

    if (booking.status !== 'CONFIRMED') {
      throw createError(`Booking status "${booking.status}" cannot be cancelled`, 409, {
        code: 'INVALID_BOOKING_STATUS',
      })
    }

    const refund = calculateRefund(booking.total_fare, booking.journey_date)
    if (!refund.allowed) {
      throw createError('Cannot cancel after the journey date has passed', 409, {
        code: 'JOURNEY_STARTED',
      })
    }

    const updateRes = await client.query(
      `
      UPDATE bookings
      SET status = 'CANCELLED',
          cancelled_at = NOW(),
          cancellation_reason = $2,
          refund_amount = $3,
          updated_at = NOW()
      WHERE id = $1
      RETURNING cancelled_at, refund_amount, status, total_fare, pnr, id
      `,
      [booking.id, cancellationReason, refund.refundAmount],
    )
    const updated = updateRes.rows[0]

    // Release seats — CANCELLED reservations are ignored by availability checks
    await client.query(
      `
      UPDATE seat_reservations
      SET status = 'CANCELLED',
          held_until = NULL,
          updated_at = NOW()
      WHERE booking_id = $1
        AND status IN ('CONFIRMED', 'BOOKED', 'HELD')
      `,
      [booking.id],
    )

    const passengersRes = await client.query(
      `
      SELECT
        passenger_seq,
        full_name,
        age,
        gender,
        coach_number,
        seat_number,
        berth_type
      FROM booking_passengers
      WHERE booking_id = $1
      ORDER BY passenger_seq ASC
      `,
      [booking.id],
    )

    await client.query('COMMIT')

    return {
      pnr: updated.pnr,
      bookingId: Number(updated.id),
      status: updated.status,
      statusMessage: statusLabel(updated.status),
      cancelledAt: updated.cancelled_at,
      cancellationReason,
      cancelledPassengers: passengersRes.rows.map((p) => ({
        seq: p.passenger_seq,
        fullName: p.full_name,
        age: p.age,
        gender: p.gender,
        releasedSeat: {
          coachNumber: p.coach_number,
          seatNumber: p.seat_number,
          berthType: p.berth_type,
        },
      })),
      totalFare: Number(updated.total_fare),
      refund: {
        currency: 'INR',
        amount: Number(updated.refund_amount),
        percent: refund.refundPercent,
        policy: refund.policy,
        hoursUntilJourney: refund.hoursUntil,
      },
      refundAmount: Number(updated.refund_amount),
      message: 'Booking cancelled successfully. Seats have been released.',
    }
  } catch (err) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // ignore
    }
    throw err
  } finally {
    client.release()
  }
}

async function getBookingsByUserId(userId, { status = null, journey = null } = {}) {
  const parsedUserId = Number(userId)
  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    throw createError('userId must be a positive integer', 400, {
      code: 'INVALID_USER_ID',
    })
  }

  const allowedStatuses = new Set(['CONFIRMED', 'CANCELLED', 'EXPIRED'])
  let statusFilter = null
  if (status != null && String(status).trim() !== '') {
    statusFilter = String(status).trim().toUpperCase()
    if (!allowedStatuses.has(statusFilter)) {
      throw createError(
        `Invalid status filter. Allowed: ${[...allowedStatuses].join(', ')}`,
        400,
        { code: 'INVALID_STATUS_FILTER' },
      )
    }
  }

  let journeyFilter = null
  if (journey != null && String(journey).trim() !== '') {
    journeyFilter = String(journey).trim().toLowerCase()
    if (!['upcoming', 'past'].includes(journeyFilter)) {
      throw createError(
        'Invalid journey filter. Allowed: upcoming, past',
        400,
        { code: 'INVALID_JOURNEY_FILTER' },
      )
    }
  }

  const params = [parsedUserId]
  const conditions = [
    'b.user_id = $1',
    'b.pnr IS NOT NULL',
    `b.status IN ('CONFIRMED', 'CANCELLED', 'EXPIRED')`,
  ]

  if (statusFilter) {
    params.push(statusFilter)
    conditions.push(`b.status = $${params.length}`)
  }

  if (journeyFilter === 'upcoming') {
    conditions.push('b.journey_date >= CURRENT_DATE')
  } else if (journeyFilter === 'past') {
    conditions.push('b.journey_date < CURRENT_DATE')
  }

  const bookingsRes = await pool.query(
    `
    SELECT
      b.id,
      b.pnr,
      b.train_no,
      b.journey_date,
      b.source_station,
      b.destination_station,
      b.class_code,
      b.status,
      b.passenger_count,
      b.total_fare,
      b.refund_amount,
      b.cancelled_at,
      b.cancellation_reason,
      b.created_at,
      b.updated_at,
      (
        SELECT tr.train_name
        FROM train_routes tr
        WHERE tr.train_no = b.train_no
        ORDER BY CAST(tr.seq AS INTEGER) ASC
        LIMIT 1
      ) AS train_name,
      (
        SELECT tr.station_name
        FROM train_routes tr
        WHERE tr.train_no = b.train_no
          AND UPPER(tr.station_code) = UPPER(b.source_station)
        ORDER BY CAST(tr.seq AS INTEGER) ASC
        LIMIT 1
      ) AS source_station_name,
      (
        SELECT tr.station_name
        FROM train_routes tr
        WHERE tr.train_no = b.train_no
          AND UPPER(tr.station_code) = UPPER(b.destination_station)
        ORDER BY CAST(tr.seq AS INTEGER) ASC
        LIMIT 1
      ) AS destination_station_name
    FROM bookings b
    WHERE ${conditions.join('\n      AND ')}
    ORDER BY
      CASE WHEN b.journey_date >= CURRENT_DATE THEN 0 ELSE 1 END ASC,
      CASE WHEN b.journey_date >= CURRENT_DATE THEN b.journey_date END ASC,
      CASE WHEN b.journey_date < CURRENT_DATE THEN b.journey_date END DESC,
      b.created_at DESC
    `,
    params,
  )

  if (!bookingsRes.rowCount) {
    return {
      userId: parsedUserId,
      total: 0,
      filters: {
        status: statusFilter,
        journey: journeyFilter,
      },
      bookings: [],
    }
  }

  const bookingIds = bookingsRes.rows.map((b) => b.id)
  const passengersRes = await pool.query(
    `
    SELECT
      booking_id,
      passenger_seq,
      full_name,
      age,
      gender,
      berth_preference,
      coach_number,
      seat_number,
      berth_type
    FROM booking_passengers
    WHERE booking_id = ANY($1::bigint[])
    ORDER BY booking_id ASC, passenger_seq ASC
    `,
    [bookingIds],
  )

  const passengersByBooking = new Map()
  for (const p of passengersRes.rows) {
    const list = passengersByBooking.get(p.booking_id) || []
    list.push({
      seq: p.passenger_seq,
      fullName: p.full_name,
      age: p.age,
      gender: p.gender,
      berthPreference: p.berth_preference,
      allocation: {
        coachNumber: p.coach_number,
        seatNumber: p.seat_number,
        berthType: p.berth_type,
      },
    })
    passengersByBooking.set(p.booking_id, list)
  }

  const bookings = bookingsRes.rows.map((b) => {
    const journeyDate = formatPgDate(b.journey_date)
    const isUpcoming = journeyDate >= formatPgDate(new Date())

    return {
      pnr: b.pnr,
      status: b.status,
      statusMessage: statusLabel(b.status),
      isActive: b.status === 'CONFIRMED',
      isUpcoming,
      train: {
        trainNo: b.train_no,
        trainName: b.train_name,
      },
      journey: {
        journeyDate,
        sourceStation: {
          code: b.source_station,
          name: b.source_station_name,
        },
        destinationStation: {
          code: b.destination_station,
          name: b.destination_station_name,
        },
        classCode: b.class_code,
      },
      classCode: b.class_code,
      passengers: passengersByBooking.get(b.id) || [],
      totalFare: Number(b.total_fare),
      refundAmount: b.refund_amount != null ? Number(b.refund_amount) : null,
      bookedAt: b.created_at,
      cancelledAt: b.cancelled_at || null,
      cancellationReason: b.cancellation_reason || null,
    }
  })

  return {
    userId: parsedUserId,
    total: bookings.length,
    filters: {
      status: statusFilter,
      journey: journeyFilter,
    },
    bookings,
  }
}

module.exports = {
  createSeatHold,
  confirmSeatHold,
  confirmHeldBookingInTx,
  getConfirmedTicketByBookingId,
  getBookingByPnr,
  cancelBookingByPnr,
  getBookingsByUserId,
}
