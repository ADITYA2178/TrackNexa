import crypto from "crypto"
import { paymentHmacSecret } from "../../config/index.js"
import { createError } from "../../utils/httpError.js"
import { formatAmount } from "./mapPayment.js"
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

export { buildProviderSignaturePayload, computeProviderSignature, signaturesMatch }