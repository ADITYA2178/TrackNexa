import * as bookingService from "../booking.service.js"
import { createError } from "../../utils/httpError.js"
import { mapPaymentRow } from "./mapPayment.js"
import { computeProviderSignature, signaturesMatch } from "./signature.js"
import { markPaymentFailed, applyHoldExpiryIfNeeded } from "./markFailed.js"
function assertVerifyInput({ paymentId, orderId, providerTxnId, providerSignature }) {
  if (!paymentId && !orderId) {
    throw createError('paymentId or orderId is required', 400, { code: 'PAYMENT_REF_REQUIRED' })
  }
  const txnId = String(providerTxnId || '').trim()
  if (!txnId) {
    throw createError('providerTxnId is required', 400, { code: 'PROVIDER_TXN_REQUIRED' })
  }
  const signature = String(providerSignature || '').trim()
  if (!signature) {
    throw createError('providerSignature is required', 400, { code: 'PROVIDER_SIGNATURE_REQUIRED' })
  }
  return { txnId, signature }
}

function assertPaymentVerifiable(payment) {
  if (payment.status === 'REFUNDED') {
    throw createError('Payment was refunded and cannot be verified', 409, { code: 'PAYMENT_REFUNDED' })
  }
  if (payment.status === 'FAILED') {
    throw createError('Payment already marked FAILED; create a new order to retry', 409, {
      code: 'PAYMENT_ALREADY_FAILED',
      paymentId: payment.payment_id,
      orderId: payment.order_id,
    })
  }
  if (payment.status !== 'PENDING') {
    throw createError(`Payment status "${payment.status}" cannot be verified`, 409, {
      code: 'INVALID_PAYMENT_STATUS',
    })
  }
}

function verifiedPayload(payment, ticket, message, idempotent) {
  return {
    payment: mapPaymentRow(payment),
    booking: { status: ticket.status, bookingId: ticket.bookingId, pnr: ticket.pnr },
    ticket,
    message,
    idempotent,
  }
}

async function handleAlreadySuccessful(client, payment) {
  const ticket = await bookingService.getConfirmedTicketByBookingId(client, payment.booking_id)
  return verifiedPayload(payment, ticket, 'Payment already verified', true)
}

async function rejectAmountMismatch(client, payment, booking) {
  await markPaymentFailed(client, payment, 'Payment amount does not match booking total_fare')
  const expiry = await applyHoldExpiryIfNeeded(client, booking)
  return createError('Payment amount does not match booking fare', 409, {
    code: 'AMOUNT_MISMATCH',
    paymentStatus: 'FAILED',
    bookingStatus: expiry.booking.status,
  })
}

async function rejectBadSignature(client, payment, booking, txnId, signature) {
  const expectedSignature = computeProviderSignature({
    orderId: payment.order_id,
    paymentId: payment.payment_id,
    amount: payment.amount,
    providerTxnId: txnId,
  })
  if (signaturesMatch(expectedSignature, signature)) return null

  payment = await markPaymentFailed(client, payment, 'Invalid provider signature')
  const expiry = await applyHoldExpiryIfNeeded(client, booking)
  return createError('Payment verification failed', 402, {
    code: 'PAYMENT_VERIFICATION_FAILED',
    paymentStatus: 'FAILED',
    bookingStatus: expiry.booking.status,
    paymentId: payment.payment_id,
    orderId: payment.order_id,
  })
}

async function handleAlreadyConfirmedBooking(client, payment, booking, txnId) {
  const successPayment = await client.query(
    `
    UPDATE payments
    SET status = 'SUCCESS',
        provider_txn_id = $2,
        paid_at = COALESCE(paid_at, NOW()),
        failure_reason = NULL,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [payment.id, txnId],
  )
  const ticket = await bookingService.getConfirmedTicketByBookingId(client, booking.id)
  return verifiedPayload(
    successPayment.rows[0],
    ticket,
    'Payment verified; booking already confirmed',
    true,
  )
}

async function markPaymentSuccess(client, payment, txnId) {
  let successPayment
  try {
    successPayment = await client.query(
      `
      UPDATE payments
      SET status = 'SUCCESS',
          provider_txn_id = $2,
          paid_at = NOW(),
          failure_reason = NULL,
          updated_at = NOW()
      WHERE id = $1
        AND status = 'PENDING'
      RETURNING *
      `,
      [payment.id, txnId],
    )
  } catch (err) {
    if (err.code === '23505') {
      throw createError('providerTxnId already used by another payment', 409, {
        code: 'PROVIDER_TXN_REUSED',
      })
    }
    throw err
  }
  if (!successPayment.rowCount) {
    throw createError('Payment is no longer pending', 409, { code: 'PAYMENT_STATE_CHANGED' })
  }
  return successPayment.rows[0]
}

async function confirmBookingAfterPayment(client, payment, booking) {
  try {
    return await bookingService.confirmHeldBookingInTx(client, booking)
  } catch (err) {
    if (err.code === 'HOLD_EXPIRED' || err.holdExpiredInTx) {
      await client.query(
        `
        UPDATE payments
        SET status = 'FAILED',
            failure_reason = 'Hold expired during verification',
            provider_txn_id = NULL,
            paid_at = NULL,
            updated_at = NOW()
        WHERE id = $1
        `,
        [payment.id],
      )
      const expiredErr = createError('Hold expired during payment verification', 410, {
        code: 'HOLD_EXPIRED',
        paymentStatus: 'FAILED',
        bookingStatus: 'EXPIRED',
      })
      expiredErr.commitBeforeThrow = true
      throw expiredErr
    }
    throw err
  }
}

export { assertVerifyInput, assertPaymentVerifiable, verifiedPayload, handleAlreadySuccessful, rejectAmountMismatch, rejectBadSignature, handleAlreadyConfirmedBooking, markPaymentSuccess, confirmBookingAfterPayment, markPaymentFailed }