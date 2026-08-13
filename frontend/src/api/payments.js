import { buildApiUrl } from '../config/api'
import { getStoredActiveHold, getStoredAuthUser } from './bookings'

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

export function resolvePaymentContext() {
  return {
    hold: getStoredActiveHold(),
    authUser: getStoredAuthUser(),
    pendingPayment: getStoredPendingPayment(),
  }
}
