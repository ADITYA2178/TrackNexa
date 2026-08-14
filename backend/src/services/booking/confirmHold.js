import { pool } from "../../config/db.js"
import { createError } from "../../utils/httpError.js"
import { confirmHeldBookingInTx } from "./confirmInTx.js"
const confirmSeatHold = async ({ holdId, userId = null }) => {
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

export { confirmSeatHold }