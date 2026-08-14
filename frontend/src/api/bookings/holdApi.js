import { buildApiUrl } from '../../config/api'

export async function createSeatHold(payload) {
  const response = await fetch(buildApiUrl('/api/bookings/hold'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to hold seats')
  }

  return data
}

export async function confirmSeatHold({ holdId, userId = null }) {
  const response = await fetch(buildApiUrl('/api/bookings/confirm'), {
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
    const error = new Error(data?.message ?? 'Unable to confirm booking')
    if (data?.pnr) error.pnr = data.pnr
    if (data?.bookingId) error.bookingId = data.bookingId
    if (data?.code) error.code = data.code
    throw error
  }

  return data
}
