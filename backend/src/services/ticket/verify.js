import { createError } from "../../utils/httpError.js"
import { formatPgDate } from "../../utils/dates.js"
import { signTicketPayload, signaturesMatch } from "./signature.js"
import {
  loadBookingForQr,
  assertQrMatchesBooking,
  buildValidQrResponse,
} from "./verifyHelpers.js"
function isValidJourneyDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return false
  return formatPgDate(parsed) === value
}

function normalizeQrPayload(body) {
  const src =
    body && typeof body.payload === 'object' && body.payload !== null
      ? { ...body, ...body.payload }
      : body || {}

  return {
    pnr: String(src.pnr || '').trim(),
    ticketRef: String(src.ref || src.ticketRef || '').trim(),
    trainNo: String(src.trn || src.trainNo || '').trim(),
    journeyDate: String(src.dt || src.journeyDate || '').trim(),
    classCode: String(src.cls || src.classCode || '').trim().toUpperCase(),
    statusCode: String(src.st || src.status || '').trim().toUpperCase(),
    signature: String(src.sig || src.signature || '').trim(),
  }
}

/**
 * Read-only QR verification. Never writes booking/seat/payment rows.
 */
async function verifyQrTicket(rawBody) {
  const qr = normalizeQrPayload(rawBody)

  if (
    !qr.pnr ||
    !qr.ticketRef ||
    !qr.trainNo ||
    !qr.journeyDate ||
    !qr.classCode ||
    !qr.statusCode ||
    !qr.signature
  ) {
    throw createError(
      'QR payload must include pnr, ticketRef, train number, journey date, class, status, and signature',
      400,
      { code: 'INVALID_PAYLOAD', valid: false },
    )
  }

  if (!isValidJourneyDate(qr.journeyDate)) {
    throw createError('Journey date in QR payload is invalid', 400, {
      code: 'INVALID_JOURNEY_DATE',
      valid: false,
    })
  }

  const expectedSig = signTicketPayload({
    pnr: qr.pnr,
    ticketRef: qr.ticketRef,
    trainNo: qr.trainNo,
    journeyDate: qr.journeyDate,
    classCode: qr.classCode,
    statusCode: qr.statusCode,
  })

  if (!signaturesMatch(expectedSig, qr.signature)) {
    throw createError('QR signature is invalid', 401, {
      code: 'INVALID_SIGNATURE',
      valid: false,
    })
  }

  const booking = await loadBookingForQr(qr)
  const storedDate = assertQrMatchesBooking(booking, qr)
  return buildValidQrResponse(booking, storedDate)
}

export { normalizeQrPayload, isValidJourneyDate, verifyQrTicket }