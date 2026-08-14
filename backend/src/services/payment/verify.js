import { pool } from "../../config/db.js"
import { createError } from "../../utils/httpError.js"
import {
  assertVerifyInput,
  assertPaymentVerifiable,
  handleAlreadySuccessful,
  rejectAmountMismatch,
  rejectBadSignature,
  handleAlreadyConfirmedBooking,
  markPaymentSuccess,
  confirmBookingAfterPayment,
  verifiedPayload,
  markPaymentFailed,
} from "./verifyHelpers.js"
/**
 * Verify provider payment and confirm booking + PNR in one transaction.
 * Ignores any client-sent amount/status; amount is taken from payments/bookings.
 */
async function verifyPayment({
  paymentId = null,
  orderId = null,
  providerTxnId,
  providerSignature,
}) {
  const { txnId, signature } = assertVerifyInput({
    paymentId,
    orderId,
    providerTxnId,
    providerSignature,
  })

  const client = await pool.connect()
  let committed = false

  try {
    await client.query('BEGIN')

    const paymentRes = await client.query(
      `
      SELECT *
      FROM payments
      WHERE ($1::text IS NOT NULL AND payment_id = $1)
         OR ($2::text IS NOT NULL AND order_id = $2)
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
      `,
      [paymentId ? String(paymentId).trim() : null, orderId ? String(orderId).trim() : null],
    )

    if (!paymentRes.rowCount) {
      throw createError('Payment order not found', 404, {
        code: 'PAYMENT_NOT_FOUND',
      })
    }

    let payment = paymentRes.rows[0]

    if (payment.status === 'SUCCESS') {
      const result = await handleAlreadySuccessful(client, payment)
      await client.query('COMMIT')
      committed = true
      return result
    }

    assertPaymentVerifiable(payment)

    const bookingRes = await client.query(
      `
      SELECT *
      FROM bookings
      WHERE id = $1
      FOR UPDATE
      `,
      [payment.booking_id],
    )

    if (!bookingRes.rowCount) {
      throw createError('Booking linked to payment not found', 404, {
        code: 'BOOKING_NOT_FOUND',
      })
    }

    const booking = bookingRes.rows[0]

    if (Number(payment.amount) !== Number(booking.total_fare)) {
      const err = await rejectAmountMismatch(client, payment, booking)
      await client.query('COMMIT')
      committed = true
      throw err
    }

    const signatureErr = await rejectBadSignature(
      client,
      payment,
      booking,
      txnId,
      signature,
    )
    if (signatureErr) {
      await client.query('COMMIT')
      committed = true
      throw signatureErr
    }

    if (booking.status === 'CONFIRMED' && booking.pnr) {
      const result = await handleAlreadyConfirmedBooking(client, payment, booking, txnId)
      await client.query('COMMIT')
      committed = true
      return result
    }

    if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
      await markPaymentFailed(
        client,
        payment,
        `Booking is ${booking.status}; cannot confirm after payment`,
      )
      await client.query('COMMIT')
      committed = true
      throw createError(`Cannot confirm booking in status ${booking.status}`, 409, {
        code: 'BOOKING_NOT_CONFIRMABLE',
        paymentStatus: 'FAILED',
        bookingStatus: booking.status,
      })
    }

    payment = await markPaymentSuccess(client, payment, txnId)
    const ticket = await confirmBookingAfterPayment(client, payment, booking)

    await client.query('COMMIT')
    committed = true

    return verifiedPayload(
      payment,
      ticket,
      'Payment verified and booking confirmed',
      false,
    )
  } catch (err) {
    if (err.commitBeforeThrow && !committed) {
      try {
        await client.query('COMMIT')
        committed = true
      } catch {
        // ignore
      }
    }
    if (!committed) {
      try {
        await client.query('ROLLBACK')
      } catch {
        // ignore
      }
    }
    throw err
  } finally {
    client.release()
  }
}

export { verifyPayment }