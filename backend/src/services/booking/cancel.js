import { pool } from "../../config/db.js"
import { createError } from "../../utils/httpError.js"
import { statusLabel } from "./passengers.js"
import { calculateRefund } from "./refund.js"
const cancelBookingByPnr = async ({
  pnr,
  userId = null,
  reason = 'USER_REQUESTED',
}) => {
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

export { cancelBookingByPnr }