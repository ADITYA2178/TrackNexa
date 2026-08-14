import { pool } from "../../config/db.js"
import { createError } from "../../utils/httpError.js"
import { generatePaymentId, generateOrderId } from "./ids.js"
import { mapPaymentRow } from "./mapPayment.js"
import {
  attachUserIfNeeded,
  assertBookingStatusPayable,
  expireHoldIfStale,
  reuseOrUpdatePending,
} from "./createOrderHelpers.js"
/**
 * Create a payment order for an active hold.
 * Amount always comes from bookings.total_fare (server-side).
 * Does NOT confirm the booking.
 */
async function createPaymentOrder({ holdId, userId = null }) {
  if (!holdId || typeof holdId !== 'string' || !holdId.trim()) {
    throw createError('holdId is required', 400, { code: 'HOLD_ID_REQUIRED' })
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
    await attachUserIfNeeded(client, booking, userId)
    assertBookingStatusPayable(booking)

    if (await expireHoldIfStale(client, booking)) {
      await client.query('COMMIT')
      committed = true
      throw createError('Hold has expired and cannot be paid', 410, {
        code: 'HOLD_EXPIRED',
      })
    }

    const successRes = await client.query(
      `
      SELECT *
      FROM payments
      WHERE booking_id = $1 AND status = 'SUCCESS'
      LIMIT 1
      FOR UPDATE
      `,
      [booking.id],
    )
    if (successRes.rowCount) {
      throw createError('Payment already completed for this hold', 409, {
        code: 'PAYMENT_ALREADY_SUCCESS',
        paymentId: successRes.rows[0].payment_id,
        orderId: successRes.rows[0].order_id,
      })
    }

    const pendingRes = await client.query(
      `
      SELECT *
      FROM payments
      WHERE booking_id = $1 AND status = 'PENDING'
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
      `,
      [booking.id],
    )

    if (pendingRes.rowCount) {
      const result = await reuseOrUpdatePending(client, booking, pendingRes.rows[0])
      await client.query('COMMIT')
      committed = true
      return result
    }

    const paymentId = generatePaymentId()
    const orderId = generateOrderId()
    const amount = Number(booking.total_fare)
    const paymentUserId =
      booking.user_id != null
        ? Number(booking.user_id)
        : userId != null
          ? Number(userId)
          : null

    const insertRes = await client.query(
      `
      INSERT INTO payments (
        payment_id, order_id, booking_id, hold_id, user_id,
        amount, currency, status, provider
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'INR', 'PENDING', 'INTERNAL')
      RETURNING *
      `,
      [paymentId, orderId, booking.id, booking.hold_id, paymentUserId, amount],
    )

    await client.query('COMMIT')
    committed = true

    return {
      ...mapPaymentRow(insertRes.rows[0]),
      message: 'Payment order created. Complete payment to confirm booking.',
      reused: false,
    }
  } catch (err) {
    if (!committed) {
      try {
        await client.query('ROLLBACK')
      } catch {
        // ignore
      }
    }

    if (err.code === '23505') {
      const again = await pool.query(
        `
        SELECT *
        FROM payments
        WHERE hold_id = $1 AND status = 'PENDING'
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [normalizedHoldId],
      )
      if (again.rowCount) {
        return {
          ...mapPaymentRow(again.rows[0]),
          message: 'Existing pending payment order returned',
          reused: true,
        }
      }
    }

    throw err
  } finally {
    client.release()
  }
}

export { createPaymentOrder }