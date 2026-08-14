import { formatPgDate } from "../../utils/dates.js"
import { HOLD_MINUTES } from "./constants.js"
const loadPassengers = async (client, bookingId) => {
  const passengersRes = await client.query(
    `
    SELECT
      passenger_seq, full_name, age, gender, berth_preference,
      preference_matched, coach_number, seat_number, berth_type
    FROM booking_passengers
    WHERE booking_id = $1
    ORDER BY passenger_seq ASC
    `,
    [bookingId],
  )
  return passengersRes.rows
}

const mapTicketResponse = (booking, { pnr, trainName, passengers }) => ({
  pnr,
  bookingId: Number(booking.id),
  holdId: booking.hold_id,
  status: 'CONFIRMED',
  train: { trainNo: booking.train_no, trainName },
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
})

const statusLabel = (status) => {
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

const mapHoldResponse = ({
  booking,
  journeyDate,
  fromStop,
  toStop,
  normalizedClass,
  passengerResults,
  distanceKm,
  farePerPassenger,
  totalFare,
  rate,
  passengerCount,
}) => ({
  holdId: booking.hold_id,
  bookingId: Number(booking.id),
  status: booking.status,
  trainId: booking.train_no,
  journeyDate,
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
    passengerCount,
    totalFare,
    breakdown: {
      baseFare: Number(rate.base_fare),
      perKmRate: Number(rate.per_km_rate),
    },
  },
  message: `Seats held for ${HOLD_MINUTES} minutes. Complete payment before hold expires.`,
})

export { loadPassengers, mapTicketResponse, statusLabel, mapHoldResponse }