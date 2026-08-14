import { pool } from "../../config/db.js"
import { createError } from "../../utils/httpError.js"
import { formatPgDate } from "../../utils/dates.js"
async function loadTicketBooking(pnr) {
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
      b.ticket_ref,
      b.train_no,
      b.journey_date,
      b.source_station,
      b.destination_station,
      b.class_code,
      b.status,
      b.passenger_count,
      b.distance_km,
      b.fare_per_passenger,
      b.total_fare,
      b.created_at,
      b.cancelled_at,
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
      coach_number,
      seat_number,
      berth_type
    FROM booking_passengers
    WHERE booking_id = $1
    ORDER BY passenger_seq ASC
    `,
    [booking.id],
  )

  return { booking, passengers: passengersRes.rows }
}

function mapTicketJson(booking, passengers, ticketRef) {
  const status = booking.status
  return {
    pnr: booking.pnr,
    ticketRef,
    status,
    statusMessage:
      status === 'CONFIRMED'
        ? 'Valid e-ticket'
        : status === 'CANCELLED'
          ? 'This booking is CANCELLED. This is not a valid travel ticket.'
          : 'This booking is EXPIRED. This is not a valid travel ticket.',
    isActive: status === 'CONFIRMED',
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
    passengers: passengers.map((p) => ({
      seq: p.passenger_seq,
      fullName: p.full_name,
      age: p.age,
      gender: p.gender,
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
    cancelledAt: booking.cancelled_at || null,
  }
}

export { loadTicketBooking, mapTicketJson }