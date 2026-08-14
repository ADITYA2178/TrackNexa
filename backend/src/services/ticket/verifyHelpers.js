import { pool } from "../../config/db.js"
import { createError } from "../../utils/httpError.js"
import { formatPgDate } from "../../utils/dates.js"
import { qrStatusCode } from "./refs.js"
async function loadBookingForQr(qr) {
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
      AND b.ticket_ref = $2
    `,
    [qr.pnr, qr.ticketRef],
  )

  if (!bookingRes.rowCount) {
    throw createError('Ticket not found for this PNR and ticket reference', 404, {
      code: 'TICKET_NOT_FOUND',
      valid: false,
    })
  }

  return bookingRes.rows[0]
}

function assertQrMatchesBooking(booking, qr) {
  const storedDate = formatPgDate(booking.journey_date)
  const storedStatus = qrStatusCode(booking.status)

  const mismatches = []
  if (String(booking.pnr) !== qr.pnr) mismatches.push('pnr')
  if (String(booking.ticket_ref) !== qr.ticketRef) mismatches.push('ticketRef')
  if (String(booking.train_no) !== qr.trainNo) mismatches.push('trainNo')
  if (storedDate !== qr.journeyDate) mismatches.push('journeyDate')
  if (String(booking.class_code).toUpperCase() !== qr.classCode) mismatches.push('classCode')

  if (mismatches.length) {
    throw createError('QR payload does not match stored booking data', 409, {
      code: 'DATA_MISMATCH',
      valid: false,
      fields: mismatches,
    })
  }

  if (booking.status === 'CANCELLED' || storedStatus === 'CAN' || qr.statusCode === 'CAN') {
    throw createError('This ticket has been cancelled', 409, {
      code: 'CANCELLED_TICKET',
      valid: false,
      pnr: booking.pnr,
      ticketRef: booking.ticket_ref,
      bookingStatus: 'CANCELLED',
    })
  }

  if (booking.status === 'EXPIRED' || storedStatus === 'EXP') {
    throw createError('This ticket is expired and not valid for travel', 409, {
      code: 'INVALID_JOURNEY_DATE',
      valid: false,
      pnr: booking.pnr,
      bookingStatus: booking.status,
    })
  }

  const today = formatPgDate(new Date())
  if (storedDate < today) {
    throw createError('Journey date has already passed', 409, {
      code: 'INVALID_JOURNEY_DATE',
      valid: false,
      pnr: booking.pnr,
      journeyDate: storedDate,
    })
  }

  if (qr.statusCode !== storedStatus) {
    throw createError('QR payload does not match stored booking data', 409, {
      code: 'DATA_MISMATCH',
      valid: false,
      fields: ['status'],
    })
  }

  return storedDate
}

async function buildValidQrResponse(booking, storedDate) {
  const passengersRes = await pool.query(
    `
    SELECT
      passenger_seq,
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
    valid: true,
    status: booking.status,
    pnr: booking.pnr,
    ticketRef: booking.ticket_ref,
    train: {
      trainNo: booking.train_no,
      trainName: booking.train_name,
    },
    journey: {
      journeyDate: storedDate,
      sourceStation: {
        code: booking.source_station,
        name: booking.source_station_name,
      },
      destinationStation: {
        code: booking.destination_station,
        name: booking.destination_station_name,
      },
    },
    classCode: booking.class_code,
    passengerCount: booking.passenger_count,
    passengers: passengersRes.rows.map((p) => ({
      seq: p.passenger_seq,
      allocation: {
        coachNumber: p.coach_number,
        seatNumber: p.seat_number,
        berthType: p.berth_type,
      },
    })),
    message: 'Ticket is valid',
  }
}

export { loadBookingForQr, assertQrMatchesBooking, buildValidQrResponse }