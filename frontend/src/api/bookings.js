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

