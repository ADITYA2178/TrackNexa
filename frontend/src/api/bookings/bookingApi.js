import { buildApiUrl } from '../../config/api'

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
