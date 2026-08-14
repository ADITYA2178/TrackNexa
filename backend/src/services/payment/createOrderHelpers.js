import { createError } from "../../utils/httpError.js"
import { mapPaymentRow } from "./mapPayment.js"
async function attachUserIfNeeded(client, booking, userId) {
  if (
    userId != null &&
    booking.user_id != null &&
    Number(userId) !== Number(booking.user_id)
  ) {
    throw createError('Hold does not belong to this user', 403, {
      code: 'HOLD_USER_MISMATCH',
    })
  }

  if (userId != null && booking.user_id == null) {
    await client.query(
      `
      UPDATE bookings
      SET user_id = $2, updated_at = NOW()
      WHERE id = $1 AND user_id IS NULL
      `,
      [booking.id, Number(userId)],
    )
    booking.user_id = Number(userId)
  }
}

function assertBookingStatusPayable(booking) {
  if (booking.status === 'CONFIRMED') {
    throw createError('Booking is already confirmed; payment order not needed', 409, {
      code: 'ALREADY_CONFIRMED',
      pnr: booking.pnr,
      bookingId: Number(booking.id),
    })
  }
  if (booking.status === 'CANCELLED') {
    throw createError('Cancelled bookings cannot be paid', 409, {
      code: 'BOOKING_CANCELLED',
    })
  }
  if (booking.status === 'EXPIRED') {
    throw createError('Hold has expired and cannot be paid', 410, {
      code: 'HOLD_EXPIRED',
    })
  }
  if (booking.status !== 'HELD') {
    throw createError(`Booking status "${booking.status}" cannot accept payment`, 409, {
      code: 'INVALID_BOOKING_STATUS',
    })
  }
}

async function expireHoldIfStale(client, booking) {
  const expiryCheck = await client.query(
    `
    SELECT (held_until IS NOT NULL AND held_until <= NOW()) AS is_expired
    FROM bookings
    WHERE id = $1
    `,
    [booking.id],
  )

  if (expiryCheck.rows[0]?.is_expired !== true) return false

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
  return true
}

async function reuseOrUpdatePending(client, booking, pending) {
  if (Number(pending.amount) !== Number(booking.total_fare)) {
    const updated = await client.query(
      `
      UPDATE payments
      SET amount = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [pending.id, booking.total_fare],
    )
    return {
      ...mapPaymentRow(updated.rows[0]),
      message: 'Existing pending payment order returned',
      reused: true,
    }
  }
  return {
    ...mapPaymentRow(pending),
    message: 'Existing pending payment order returned',
    reused: true,
  }
}

export { attachUserIfNeeded, assertBookingStatusPayable, expireHoldIfStale, reuseOrUpdatePending }