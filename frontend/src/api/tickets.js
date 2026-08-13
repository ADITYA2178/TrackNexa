import { buildApiUrl } from '../config/api'

export async function verifyTicket(payload) {
  const response = await fetch(buildApiUrl('/api/tickets/verify'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.message ?? 'Ticket verification failed')
    error.details = data
    throw error
  }

  return data
}

/** Accepts raw QR JSON string or object and normalizes for the verify API. */
export function parseQrInput(raw) {
  if (raw == null) return null

  let value = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return null
    try {
      value = JSON.parse(trimmed)
    } catch {
      throw new Error('QR text must be valid JSON from the ticket QR payload')
    }
  }

  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid QR payload')
  }

  // Already wrapped
  if (value.payload && typeof value.payload === 'object') {
    return value
  }

  // Compact ticket QR shape from backend buildQrPayload
  if (value.pnr || value.ref || value.trn) {
    return { payload: value }
  }

  return value
}
