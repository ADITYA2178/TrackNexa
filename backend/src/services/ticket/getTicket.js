import QRCode from "qrcode"
import { pool } from "../../config/db.js"
import { ensureTicketRef } from "./refs.js"
import { loadTicketBooking, mapTicketJson } from "./loadTicket.js"
import { buildQrPayload } from "./signature.js"
import { buildPdfBuffer } from "./pdf.js"
async function getTicketByPnr(pnr) {
  const { booking, passengers } = await loadTicketBooking(pnr)

  const client = await pool.connect()
  let ticketRef
  try {
    await client.query('BEGIN')
    ticketRef = await ensureTicketRef(client, booking)
    await client.query('COMMIT')
  } catch (err) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // ignore
    }
    throw err
  } finally {
    client.release()
  }

  const ticket = mapTicketJson(booking, passengers, ticketRef)
  const qrPayload = buildQrPayload(ticket)
  const qrPng = await QRCode.toBuffer(JSON.stringify(qrPayload), {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 240,
  })
  const pdfBuffer = await buildPdfBuffer(ticket, qrPng)

  return {
    ticket: {
      ...ticket,
      qr: {
        payload: qrPayload,
        imageBase64: `data:image/png;base64,${qrPng.toString('base64')}`,
      },
      download: {
        contentType: 'application/pdf',
        filename: `TrackNexa-Ticket-${ticket.pnr}.pdf`,
      },
    },
    pdfBuffer,
    filename: `TrackNexa-Ticket-${ticket.pnr}.pdf`,
  }
}

export { getTicketByPnr }