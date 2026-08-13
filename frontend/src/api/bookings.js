import { buildApiUrl } from '../config/api'

export const BERTH_PREFERENCES = [
  { value: 'ANY', label: 'No preference' },
  { value: 'LB', label: 'Lower' },
  { value: 'MB', label: 'Middle' },
  { value: 'UB', label: 'Upper' },
  { value: 'SL', label: 'Side Lower' },
  { value: 'SU', label: 'Side Upper' },
  { value: 'WS', label: 'Window' },
  { value: 'AS', label: 'Aisle' },
  { value: 'SEAT', label: 'Seat' },
]

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
]

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

export function getStoredAuthUser() {
  try {
    return JSON.parse(localStorage.getItem('authUser'))
  } catch {
    return null
  }
}

export function getStoredHoldDraft() {
  try {
    return JSON.parse(sessionStorage.getItem('seatHoldDraft'))
  } catch {
    return null
  }
}

export function storeActiveHold(hold) {
  sessionStorage.setItem('activeHold', JSON.stringify(hold))
}

export function getStoredActiveHold() {
  try {
    return JSON.parse(sessionStorage.getItem('activeHold'))
  } catch {
    return null
  }
}

export async function getTicketByPnr(pnr) {
  const response = await fetch(
    buildApiUrl(`/api/bookings/${encodeURIComponent(pnr)}/ticket`),
  )
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to load ticket')
  }

  return data
}

export async function getBookingByPnr(pnr) {
  const response = await fetch(
    buildApiUrl(`/api/bookings/${encodeURIComponent(pnr)}`),
  )
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to load booking details')
  }

  return data
}

export async function cancelBooking({ pnr, userId = null, reason = 'USER_REQUESTED' }) {
  const response = await fetch(buildApiUrl('/api/bookings/cancel'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pnr,
      userId,
      reason,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to cancel booking')
  }

  return data
}

export async function getBookingsByUser(userId, { status = null, journey = null } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (journey) params.set('journey', journey)

  const query = params.toString()
  const path = `/api/bookings/user/${encodeURIComponent(userId)}${query ? `?${query}` : ''}`

  const response = await fetch(buildApiUrl(path))
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to load your bookings')
  }

  return data
}

export const CANCEL_REASONS = [
  { value: 'USER_REQUESTED', label: 'Changed my plans' },
  { value: 'WRONG_TRAIN', label: 'Booked the wrong train' },
  { value: 'DATE_CHANGE', label: 'Need a different date' },
  { value: 'PASSENGER_UNAVAILABLE', label: 'Passenger unavailable' },
  { value: 'OTHER', label: 'Other reason' },
]

/** Mirrors backend refund policy for preview only. */
export function estimateRefund(totalFare, journeyDate) {
  const fare = Math.max(Number(totalFare) || 0, 0)
  if (!journeyDate) {
    return { allowed: false, refundAmount: 0, refundPercent: 0, policy: 'UNKNOWN' }
  }

  const journey = new Date(`${String(journeyDate).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(journey.getTime())) {
    return { allowed: false, refundAmount: 0, refundPercent: 0, policy: 'UNKNOWN' }
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (journey < startOfToday) {
    return {
      allowed: false,
      refundAmount: 0,
      refundPercent: 0,
      policy: 'JOURNEY_STARTED',
      label: 'Journey date has passed — cancel not allowed',
    }
  }

  const hoursUntil = (journey.getTime() - now.getTime()) / (1000 * 60 * 60)
  let refundPercent = 0
  let policy = 'WITHIN_4H'
  let label = 'Less than 4 hours — no refund'

  if (hoursUntil >= 48) {
    refundPercent = 100
    policy = 'GE_48H'
    label = '48+ hours before journey — 100% refund'
  } else if (hoursUntil >= 12) {
    refundPercent = 75
    policy = 'GE_12H'
    label = '12–48 hours before journey — 75% refund'
  } else if (hoursUntil >= 4) {
    refundPercent = 50
    policy = 'GE_4H'
    label = '4–12 hours before journey — 50% refund'
  }

  return {
    allowed: true,
    refundAmount: Math.round(((fare * refundPercent) / 100) * 100) / 100,
    refundPercent,
    policy,
    hoursUntil: Math.round(hoursUntil * 10) / 10,
    label,
  }
}

export async function downloadTicketPdf(pnr) {
  const response = await fetch(
    buildApiUrl(`/api/bookings/${encodeURIComponent(pnr)}/ticket?format=pdf`),
    {
      headers: {
        Accept: 'application/pdf',
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message ?? 'Unable to download ticket PDF')
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/i)
  const filename = match?.[1] || `TrackNexa-Ticket-${pnr}.pdf`

  return { blob, filename }
}

