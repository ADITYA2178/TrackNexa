import { buildApiUrl } from '../config/api'
import { getStoredActiveHold, getStoredAuthUser } from './bookings'

const PAYMENT_HMAC_SECRET = import.meta.env.VITE_PAYMENT_HMAC_SECRET ?? ''

export function hasPaymentHmacSecret() {
  return Boolean(String(PAYMENT_HMAC_SECRET).trim())
}

function formatAmount(amount) {
  return Number(amount).toFixed(2)
}

function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** Matches backend: HMAC-SHA256 hex of orderId|paymentId|amount|providerTxnId */
export async function buildProviderSignature({
  orderId,
  paymentId,
  amount,
  providerTxnId,
}) {
  const secret = String(PAYMENT_HMAC_SECRET).trim()
  if (!secret) {
    throw new Error(
      'Add VITE_PAYMENT_HMAC_SECRET to frontend/.env (same value as backend PAYMENT_HMAC_SECRET or AES_SECRET_KEY)',
    )
  }

  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure crypto is unavailable in this browser')
  }

  const payload = `${orderId}|${paymentId}|${formatAmount(amount)}|${providerTxnId}`
  const encoder = new TextEncoder()
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return bufferToHex(signature)
}

export function generateProviderTxnId() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase()
  return `TXN-${stamp}-${rand}`
}

export async function createPaymentOrder({ holdId, userId = null }) {
  const response = await fetch(buildApiUrl('/api/payments/create-order'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      holdId,
      userId,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to create payment order')
  }

  return data
}

export async function verifyPayment({
  paymentId,
  orderId,
  providerTxnId,
  providerSignature,
}) {
  const response = await fetch(buildApiUrl('/api/payments/verify'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentId,
      orderId,
      providerTxnId,
      providerSignature,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Payment verification failed')
  }

  return data
}

export function storePendingPayment(payment) {
  sessionStorage.setItem('pendingPayment', JSON.stringify(payment))
}

export function getStoredPendingPayment() {
  try {
    return JSON.parse(sessionStorage.getItem('pendingPayment'))
  } catch {
    return null
  }
}

export function clearPendingPayment() {
  sessionStorage.removeItem('pendingPayment')
}

export function storeConfirmedBooking(result) {
  sessionStorage.setItem('confirmedBooking', JSON.stringify(result))
}

export function getStoredConfirmedBooking() {
  try {
    return JSON.parse(sessionStorage.getItem('confirmedBooking'))
  } catch {
    return null
  }
}

export function resolvePaymentContext() {
  return {
    hold: getStoredActiveHold(),
    authUser: getStoredAuthUser(),
    pendingPayment: getStoredPendingPayment(),
  }
}
