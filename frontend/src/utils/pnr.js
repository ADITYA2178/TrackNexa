import { getStoredConfirmedBooking } from '../api/payments'

export function normalizePnrInput(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10)
}

export function resolvePnr(paramPnr) {
  if (paramPnr && /^\d{10}$/.test(paramPnr)) return paramPnr
  const confirmed = getStoredConfirmedBooking()
  return confirmed?.booking?.pnr ?? confirmed?.ticket?.pnr ?? null
}

export function resolveInitialPnr(paramPnr) {
  if (paramPnr && /^\d{10}$/.test(paramPnr)) return paramPnr
  const confirmed = getStoredConfirmedBooking()
  return confirmed?.booking?.pnr ?? confirmed?.ticket?.pnr ?? ''
}
