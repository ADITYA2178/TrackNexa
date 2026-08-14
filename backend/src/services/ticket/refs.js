import crypto from "crypto"
import { createError } from "../../utils/httpError.js"
function generateTicketRef() {
  const rand = crypto.randomBytes(5).toString('hex').toUpperCase()
  return `TKT${rand}`
}

function qrStatusCode(bookingStatus) {
  if (bookingStatus === 'CONFIRMED') return 'CNF'
  if (bookingStatus === 'CANCELLED') return 'CAN'
  if (bookingStatus === 'EXPIRED') return 'EXP'
  return 'UNK'
}

async function ensureTicketRef(client, booking) {
  if (booking.ticket_ref) return booking.ticket_ref

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const ticketRef = generateTicketRef()
    try {
      const result = await client.query(
        `
        UPDATE bookings
        SET ticket_ref = $1, updated_at = NOW()
        WHERE id = $2 AND ticket_ref IS NULL
        RETURNING ticket_ref
        `,
        [ticketRef, booking.id],
      )
      if (result.rowCount) return result.rows[0].ticket_ref

      const existing = await client.query(
        `SELECT ticket_ref FROM bookings WHERE id = $1`,
        [booking.id],
      )
      if (existing.rows[0]?.ticket_ref) return existing.rows[0].ticket_ref
    } catch (err) {
      if (err.code === '23505') continue
      throw err
    }
  }

  throw createError('Unable to generate unique ticket reference', 500, {
    code: 'TICKET_REF_FAILED',
  })
}

export { generateTicketRef, ensureTicketRef, qrStatusCode }