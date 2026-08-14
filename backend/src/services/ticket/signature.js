import crypto from "crypto"
import { ticketHmacSecret } from "../../config/index.js"
import { createError } from "../../utils/httpError.js"
import { qrStatusCode } from "./refs.js"
function signTicketPayload({ pnr, ticketRef, trainNo, journeyDate, classCode, statusCode }) {
  if (!ticketHmacSecret) {
    throw createError('TICKET_HMAC_SECRET / AES_SECRET_KEY is not configured', 500, {
      code: 'TICKET_SECRET_MISSING',
    })
  }
  const canonical = `${pnr}|${ticketRef}|${trainNo}|${journeyDate}|${classCode}|${statusCode}`
  return crypto.createHmac('sha256', ticketHmacSecret).update(canonical).digest('hex')
}

/**
 * Compact verification payload — no names, ages, userId, holdId, or fare.
 */
function buildQrPayload(ticket) {
  const statusCode = qrStatusCode(ticket.status)
  const payload = {
    v: 1,
    pnr: ticket.pnr,
    ref: ticket.ticketRef,
    trn: ticket.train.trainNo,
    dt: ticket.journey.journeyDate,
    cls: ticket.classCode,
    st: statusCode,
  }
  payload.sig = signTicketPayload({
    pnr: payload.pnr,
    ticketRef: payload.ref,
    trainNo: payload.trn,
    journeyDate: payload.dt,
    classCode: payload.cls,
    statusCode: payload.st,
  })
  return payload
}

function signaturesMatch(expected, provided) {
  if (!expected || !provided || typeof provided !== 'string') return false
  const a = Buffer.from(String(expected).toLowerCase(), 'utf8')
  const b = Buffer.from(provided.trim().toLowerCase(), 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export { signTicketPayload, buildQrPayload, signaturesMatch }