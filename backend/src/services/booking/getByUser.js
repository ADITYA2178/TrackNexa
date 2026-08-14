import { pool } from "../../config/db.js"
import { createError } from "../../utils/httpError.js"
import { formatPgDate } from "../../utils/dates.js"
import { statusLabel } from "./passengers.js"
const getBookingsByUserId = async (userId, { status = null, journey = null } = {}) => {
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
      filters: { status: statusFilter, journey: journeyFilter },
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

  const today = formatPgDate(new Date())
  const bookings = bookingsRes.rows.map((b) => {
    const journeyDate = formatPgDate(b.journey_date)
    return {
      pnr: b.pnr,
      status: b.status,
      statusMessage: statusLabel(b.status),
      isActive: b.status === 'CONFIRMED',
      isUpcoming: journeyDate >= today,
      train: { trainNo: b.train_no, trainName: b.train_name },
      journey: {
        journeyDate,
        sourceStation: { code: b.source_station, name: b.source_station_name },
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
    filters: { status: statusFilter, journey: journeyFilter },
    bookings,
  }
}

export { getBookingsByUserId }