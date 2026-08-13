const crypto = require('crypto')
const { pool } = require('../config/db')
const { paymentHmacSecret } = require('../config')
const bookingService = require('./booking.service')

function createError(message, status, extra = {}) {
  const error = new Error(message)
  error.status = status
  Object.assign(error, extra)
  return error
}

function generatePaymentId() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `PAY-${stamp}-${rand}`
}

function generateOrderId() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `ORD-${stamp}-${rand}`
}

function mapPaymentRow(row) {
  return {
    paymentId: row.payment_id,
    orderId: row.order_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    holdId: row.hold_id,
    bookingId: Number(row.booking_id),
    providerTxnId: row.provider_txn_id || null,
    paidAt: row.paid_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function formatAmount(amount) {
  return Number(amount).toFixed(2)
}

/**
 * Provider signature: HMAC-SHA256 hex of
 *   orderId|paymentId|amount|providerTxnId
 * using PAYMENT_HMAC_SECRET (falls back to AES_SECRET_KEY).
 * Amount in the signed payload must match the DB payment amount.
 */
function buildProviderSignaturePayload({ orderId, paymentId, amount, providerTxnId }) {
  return `${orderId}|${paymentId}|${formatAmount(amount)}|${providerTxnId}`
}

function computeProviderSignature({ orderId, paymentId, amount, providerTxnId }) {
  if (!paymentHmacSecret) {
    throw createError('PAYMENT_HMAC_SECRET / AES_SECRET_KEY is not configured', 500, {
      code: 'PAYMENT_SECRET_MISSING',
    })
  }
  const payload = buildProviderSignaturePayload({
    orderId,
    paymentId,
    amount,
    providerTxnId,
  })
  return crypto.createHmac('sha256', paymentHmacSecret).update(payload).digest('hex')
}

function signaturesMatch(expected, provided) {
  if (!expected || !provided || typeof provided !== 'string') return false
  const expectedNorm = Buffer.from(String(expected).toLowerCase(), 'utf8')
  const providedNorm = Buffer.from(provided.trim().toLowerCase(), 'utf8')
  if (expectedNorm.length !== providedNorm.length) return false
  return crypto.timingSafeEqual(expectedNorm, providedNorm)
}

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

    const expiryCheck = await client.query(
      `
      SELECT (held_until IS NOT NULL AND held_until <= NOW()) AS is_expired
      FROM bookings
      WHERE id = $1
      `,
      [booking.id],
    )

    if (expiryCheck.rows[0]?.is_expired === true) {
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
      const existing = pendingRes.rows[0]
      if (Number(existing.amount) !== Number(booking.total_fare)) {
        const updated = await client.query(
          `
          UPDATE payments
          SET amount = $2, updated_at = NOW()
          WHERE id = $1
          RETURNING *
          `,
          [existing.id, booking.total_fare],
        )
        await client.query('COMMIT')
        committed = true
        return {
          ...mapPaymentRow(updated.rows[0]),
          message: 'Existing pending payment order returned',
          reused: true,
        }
      }
      await client.query('COMMIT')
      committed = true
      return {
        ...mapPaymentRow(existing),
        message: 'Existing pending payment order returned',
        reused: true,
      }
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
      [
        paymentId,
        orderId,
        booking.id,
        booking.hold_id,
        paymentUserId,
        amount,
      ],
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

async function markPaymentFailed(client, payment, reason) {
  const result = await client.query(
    `
    UPDATE payments
    SET status = 'FAILED',
        failure_reason = $2,
        updated_at = NOW()
    WHERE id = $1
      AND status = 'PENDING'
    RETURNING *
    `,
    [payment.id, reason],
  )
  return result.rows[0] || payment
}

async function applyHoldExpiryIfNeeded(client, booking) {
  const expiryCheck = await client.query(
    `
    SELECT (held_until IS NOT NULL AND held_until <= NOW()) AS is_expired
    FROM bookings
    WHERE id = $1
    `,
    [booking.id],
  )

  if (!expiryCheck.rows[0]?.is_expired) {
    return { expired: false, booking }
  }

  await client.query(
    `
    UPDATE bookings
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE id = $1 AND status = 'HELD'
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

  return {
    expired: true,
    booking: { ...booking, status: 'EXPIRED' },
  }
}

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
  if (!paymentId && !orderId) {
    throw createError('paymentId or orderId is required', 400, {
      code: 'PAYMENT_REF_REQUIRED',
    })
  }

  const txnId = String(providerTxnId || '').trim()
  if (!txnId) {
    throw createError('providerTxnId is required', 400, {
      code: 'PROVIDER_TXN_REQUIRED',
    })
  }

  const signature = String(providerSignature || '').trim()
  if (!signature) {
    throw createError('providerSignature is required', 400, {
      code: 'PROVIDER_SIGNATURE_REQUIRED',
    })
  }

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

    // Idempotent success path
    if (payment.status === 'SUCCESS') {
      const ticket = await bookingService.getConfirmedTicketByBookingId(
        client,
        payment.booking_id,
      )
      await client.query('COMMIT')
      committed = true
      return {
        payment: mapPaymentRow(payment),
        booking: {
          status: ticket.status,
          bookingId: ticket.bookingId,
          pnr: ticket.pnr,
        },
        ticket,
        message: 'Payment already verified',
        idempotent: true,
      }
    }

    if (payment.status === 'REFUNDED') {
      throw createError('Payment was refunded and cannot be verified', 409, {
        code: 'PAYMENT_REFUNDED',
      })
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

    let booking = bookingRes.rows[0]

    // Amount must match hold fare (server-side only)
    if (Number(payment.amount) !== Number(booking.total_fare)) {
      payment = await markPaymentFailed(
        client,
        payment,
        'Payment amount does not match booking total_fare',
      )
      const expiry = await applyHoldExpiryIfNeeded(client, booking)
      await client.query('COMMIT')
      committed = true
      throw createError('Payment amount does not match booking fare', 409, {
        code: 'AMOUNT_MISMATCH',
        paymentStatus: 'FAILED',
        bookingStatus: expiry.booking.status,
      })
    }

    // Verify provider signature using DB amount — never trust client amount/status
    const expectedSignature = computeProviderSignature({
      orderId: payment.order_id,
      paymentId: payment.payment_id,
      amount: payment.amount,
      providerTxnId: txnId,
    })

    if (!signaturesMatch(expectedSignature, signature)) {
      payment = await markPaymentFailed(client, payment, 'Invalid provider signature')
      const expiry = await applyHoldExpiryIfNeeded(client, booking)
      await client.query('COMMIT')
      committed = true

      const err = createError('Payment verification failed', 402, {
        code: 'PAYMENT_VERIFICATION_FAILED',
        paymentStatus: 'FAILED',
        bookingStatus: expiry.booking.status,
        paymentId: payment.payment_id,
        orderId: payment.order_id,
      })
      throw err
    }

    if (booking.status === 'CONFIRMED' && booking.pnr) {
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
      await client.query('COMMIT')
      committed = true
      return {
        payment: mapPaymentRow(successPayment.rows[0]),
        booking: {
          status: ticket.status,
          bookingId: ticket.bookingId,
          pnr: ticket.pnr,
        },
        ticket,
        message: 'Payment verified; booking already confirmed',
        idempotent: true,
      }
    }

    if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
      payment = await markPaymentFailed(
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

    // Mark SUCCESS then confirm hold + PNR in same transaction
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
      throw createError('Payment is no longer pending', 409, {
        code: 'PAYMENT_STATE_CHANGED',
      })
    }

    payment = successPayment.rows[0]

    let ticket
    try {
      ticket = await bookingService.confirmHeldBookingInTx(client, booking)
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
        await client.query('COMMIT')
        committed = true
        throw createError('Hold expired during payment verification', 410, {
          code: 'HOLD_EXPIRED',
          paymentStatus: 'FAILED',
          bookingStatus: 'EXPIRED',
        })
      }
      throw err
    }

    await client.query('COMMIT')
    committed = true

    return {
      payment: mapPaymentRow(payment),
      booking: {
        status: ticket.status,
        bookingId: ticket.bookingId,
        pnr: ticket.pnr,
      },
      ticket,
      message: 'Payment verified and booking confirmed',
      idempotent: false,
    }
  } catch (err) {
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

module.exports = {
  createPaymentOrder,
  verifyPayment,
  computeProviderSignature,
  buildProviderSignaturePayload,
}
