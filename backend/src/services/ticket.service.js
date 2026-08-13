const crypto = require('crypto')
const PDFDocument = require('pdfkit')
const QRCode = require('qrcode')
const { pool } = require('../config/db')
const { ticketHmacSecret } = require('../config')

function createError(message, status, extra = {}) {
  const error = new Error(message)
  error.status = status
  Object.assign(error, extra)
  return error
}

function formatPgDate(value) {
  if (!value) return null
  if (typeof value === 'string') return value.slice(0, 10)
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

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

async function loadTicketBooking(pnr) {
  const normalized = String(pnr || '').trim()
  if (!/^\d{10}$/.test(normalized)) {
    throw createError('PNR must be a 10-digit number', 400, {
      code: 'INVALID_PNR',
    })
  }

  const bookingRes = await pool.query(
    `
    SELECT
      b.id,
      b.pnr,
      b.ticket_ref,
      b.train_no,
      b.journey_date,
      b.source_station,
      b.destination_station,
      b.class_code,
      b.status,
      b.passenger_count,
      b.distance_km,
      b.fare_per_passenger,
      b.total_fare,
      b.created_at,
      b.cancelled_at,
      (
        SELECT tr.train_name
        FROM train_routes tr
        WHERE tr.train_no = b.train_no
        ORDER BY CAST(tr.seq AS INTEGER) ASC
        LIMIT 1
      ) AS train_name,
      (
        SELECT tr.station_name
        FROM train_routes tr
        WHERE tr.train_no = b.train_no
          AND UPPER(tr.station_code) = UPPER(b.source_station)
        ORDER BY CAST(tr.seq AS INTEGER) ASC
        LIMIT 1
      ) AS source_station_name,
      (
        SELECT tr.station_name
        FROM train_routes tr
        WHERE tr.train_no = b.train_no
          AND UPPER(tr.station_code) = UPPER(b.destination_station)
        ORDER BY CAST(tr.seq AS INTEGER) ASC
        LIMIT 1
      ) AS destination_station_name
    FROM bookings b
    WHERE b.pnr = $1
    `,
    [normalized],
  )

  if (!bookingRes.rowCount) {
    throw createError(`PNR ${normalized} not found`, 404, {
      code: 'PNR_NOT_FOUND',
    })
  }

  const booking = bookingRes.rows[0]
  if (!['CONFIRMED', 'CANCELLED', 'EXPIRED'].includes(booking.status)) {
    throw createError(`PNR ${normalized} not found`, 404, {
      code: 'PNR_NOT_FOUND',
    })
  }

  const passengersRes = await pool.query(
    `
    SELECT
      passenger_seq,
      full_name,
      age,
      gender,
      coach_number,
      seat_number,
      berth_type
    FROM booking_passengers
    WHERE booking_id = $1
    ORDER BY passenger_seq ASC
    `,
    [booking.id],
  )

  return { booking, passengers: passengersRes.rows }
}

function mapTicketJson(booking, passengers, ticketRef) {
  const status = booking.status
  return {
    pnr: booking.pnr,
    ticketRef,
    status,
    statusMessage:
      status === 'CONFIRMED'
        ? 'Valid e-ticket'
        : status === 'CANCELLED'
          ? 'This booking is CANCELLED. This is not a valid travel ticket.'
          : 'This booking is EXPIRED. This is not a valid travel ticket.',
    isActive: status === 'CONFIRMED',
    train: {
      trainNo: booking.train_no,
      trainName: booking.train_name,
    },
    journey: {
      journeyDate: formatPgDate(booking.journey_date),
      sourceStation: {
        code: booking.source_station,
        name: booking.source_station_name,
      },
      destinationStation: {
        code: booking.destination_station,
        name: booking.destination_station_name,
      },
      classCode: booking.class_code,
      distanceKm: Number(booking.distance_km),
    },
    classCode: booking.class_code,
    passengers: passengers.map((p) => ({
      seq: p.passenger_seq,
      fullName: p.full_name,
      age: p.age,
      gender: p.gender,
      allocation: {
        coachNumber: p.coach_number,
        seatNumber: p.seat_number,
        berthType: p.berth_type,
      },
    })),
    fare: {
      currency: 'INR',
      perPassenger: Number(booking.fare_per_passenger),
      passengerCount: booking.passenger_count,
      totalFare: Number(booking.total_fare),
    },
    totalFare: Number(booking.total_fare),
    bookedAt: booking.created_at,
    cancelledAt: booking.cancelled_at || null,
  }
}

function drawPdf(doc, ticket, qrPng) {
  const teal = '#0D9488'
  const amber = '#F59E0B'
  const ink = '#111827'
  const muted = '#6B7280'
  const cancelled = ticket.status === 'CANCELLED' || ticket.status === 'EXPIRED'

  doc.rect(0, 0, doc.page.width, 72).fill(cancelled ? '#991B1B' : teal)
  doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
  doc.text('TRACK NEXA', 40, 18, { continued: false })
  doc.fontSize(11).font('Helvetica')
  doc.text(cancelled ? `${ticket.status} — NOT VALID FOR TRAVEL` : 'ELECTRONIC RESERVATION SLIP', 40, 44)

  doc.fillColor(ink)
  doc.fontSize(10).font('Helvetica')
  doc.text(`PNR: ${ticket.pnr}`, 40, 92)
  doc.font('Helvetica-Bold').fontSize(12)
  doc.text(`Ticket Ref: ${ticket.ticketRef}`, 40, 108)
  doc.font('Helvetica').fontSize(10).fillColor(muted)
  doc.text(`Status: ${ticket.status}`, 40, 126)

  if (qrPng) {
    doc.image(qrPng, doc.page.width - 150, 86, { width: 110, height: 110 })
    doc.fontSize(7).fillColor(muted).text('Scan to verify', doc.page.width - 150, 198, {
      width: 110,
      align: 'center',
    })
  }

  if (cancelled) {
    doc.save()
    doc.rotate(-28, { origin: [300, 420] })
    doc.fontSize(48).fillColor('#FECACA').font('Helvetica-Bold')
    doc.opacity(0.55)
    doc.text(ticket.status, 80, 360, { width: 480, align: 'center' })
    doc.restore()
    doc.opacity(1)
  }

  const y0 = 220
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(12)
  doc.text('Journey', 40, y0)
  doc.moveTo(40, y0 + 16).lineTo(400, y0 + 16).strokeColor(amber).lineWidth(1.5).stroke()

  doc.fillColor(ink).font('Helvetica').fontSize(10)
  const journeyLines = [
    ['Train', `${ticket.train.trainNo}  ${ticket.train.trainName || ''}`],
    ['Date', ticket.journey.journeyDate],
    ['From', `${ticket.journey.sourceStation.code}  ${ticket.journey.sourceStation.name || ''}`],
    ['To', `${ticket.journey.destinationStation.code}  ${ticket.journey.destinationStation.name || ''}`],
    ['Class', ticket.classCode],
    ['Distance', `${ticket.journey.distanceKm} km`],
  ]
  let y = y0 + 28
  for (const [label, value] of journeyLines) {
    doc.fillColor(muted).text(label, 40, y, { width: 90 })
    doc.fillColor(ink).text(String(value), 140, y, { width: 260 })
    y += 16
  }

  y += 12
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(12)
  doc.text('Passengers', 40, y)
  doc.moveTo(40, y + 16).lineTo(555, y + 16).strokeColor(amber).lineWidth(1.5).stroke()
  y += 28

  doc.font('Helvetica-Bold').fontSize(9).fillColor(muted)
  doc.text('#', 40, y, { width: 20 })
  doc.text('Name', 60, y, { width: 180 })
  doc.text('Age', 250, y, { width: 40 })
  doc.text('Gender', 290, y, { width: 60 })
  doc.text('Coach', 360, y, { width: 50 })
  doc.text('Seat', 420, y, { width: 50 })
  doc.text('Berth', 480, y, { width: 50 })
  y += 16
  doc.font('Helvetica').fontSize(10).fillColor(ink)

  for (const p of ticket.passengers) {
    if (y > 700) {
      doc.addPage()
      y = 50
    }
    doc.text(String(p.seq), 40, y, { width: 20 })
    doc.text(p.fullName, 60, y, { width: 180 })
    doc.text(String(p.age), 250, y, { width: 40 })
    doc.text(p.gender, 290, y, { width: 60 })
    doc.text(p.allocation.coachNumber || '-', 360, y, { width: 50 })
    doc.text(p.allocation.seatNumber || '-', 420, y, { width: 50 })
    doc.text(p.allocation.berthType || '-', 480, y, { width: 50 })
    y += 16
  }

  y += 16
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(12)
  doc.text('Fare', 40, y)
  doc.moveTo(40, y + 16).lineTo(300, y + 16).strokeColor(amber).lineWidth(1.5).stroke()
  y += 28
  doc.font('Helvetica').fontSize(10).fillColor(ink)
  doc.text(`Passengers: ${ticket.fare.passengerCount}`, 40, y)
  y += 16
  doc.text(`Per passenger: INR ${ticket.fare.perPassenger.toFixed(2)}`, 40, y)
  y += 16
  doc.font('Helvetica-Bold')
  doc.text(`Total fare: INR ${ticket.fare.totalFare.toFixed(2)}`, 40, y)

  y += 36
  doc.font('Helvetica').fontSize(8).fillColor(muted)
  const footer = cancelled
    ? 'This document is not valid for travel. Booking has been cancelled or expired.'
    : 'Carry a valid ID. Ticket generated from Track Nexa server records. QR contains a signed PNR verification payload only.'
  doc.text(footer, 40, y, { width: 515 })
}

async function buildPdfBuffer(ticket, qrPng) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: {
      Title: `Track Nexa Ticket ${ticket.pnr}`,
      Author: 'Track Nexa',
    } })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    drawPdf(doc, ticket, qrPng)
    doc.end()
  })
}

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

function signaturesMatch(expected, provided) {
  if (!expected || !provided || typeof provided !== 'string') return false
  const a = Buffer.from(String(expected).toLowerCase(), 'utf8')
  const b = Buffer.from(provided.trim().toLowerCase(), 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

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

  const bookingRes = await pool.query(
    `
    SELECT
      b.id,
      b.pnr,
      b.ticket_ref,
      b.train_no,
      b.journey_date,
      b.source_station,
      b.destination_station,
      b.class_code,
      b.status,
      b.passenger_count,
      (
        SELECT tr.train_name
        FROM train_routes tr
        WHERE tr.train_no = b.train_no
        ORDER BY CAST(tr.seq AS INTEGER) ASC
        LIMIT 1
      ) AS train_name,
      (
        SELECT tr.station_name
        FROM train_routes tr
        WHERE tr.train_no = b.train_no
          AND UPPER(tr.station_code) = UPPER(b.source_station)
        ORDER BY CAST(tr.seq AS INTEGER) ASC
        LIMIT 1
      ) AS source_station_name,
      (
        SELECT tr.station_name
        FROM train_routes tr
        WHERE tr.train_no = b.train_no
          AND UPPER(tr.station_code) = UPPER(b.destination_station)
        ORDER BY CAST(tr.seq AS INTEGER) ASC
        LIMIT 1
      ) AS destination_station_name
    FROM bookings b
    WHERE b.pnr = $1
      AND b.ticket_ref = $2
    `,
    [qr.pnr, qr.ticketRef],
  )

  if (!bookingRes.rowCount) {
    throw createError('Ticket not found for this PNR and ticket reference', 404, {
      code: 'TICKET_NOT_FOUND',
      valid: false,
    })
  }

  const booking = bookingRes.rows[0]
  const storedDate = formatPgDate(booking.journey_date)
  const storedStatus = qrStatusCode(booking.status)

  const mismatches = []
  if (String(booking.pnr) !== qr.pnr) mismatches.push('pnr')
  if (String(booking.ticket_ref) !== qr.ticketRef) mismatches.push('ticketRef')
  if (String(booking.train_no) !== qr.trainNo) mismatches.push('trainNo')
  if (storedDate !== qr.journeyDate) mismatches.push('journeyDate')
  if (String(booking.class_code).toUpperCase() !== qr.classCode) mismatches.push('classCode')

  if (mismatches.length) {
    throw createError('QR payload does not match stored booking data', 409, {
      code: 'DATA_MISMATCH',
      valid: false,
      fields: mismatches,
    })
  }

  if (booking.status === 'CANCELLED' || storedStatus === 'CAN' || qr.statusCode === 'CAN') {
    throw createError('This ticket has been cancelled', 409, {
      code: 'CANCELLED_TICKET',
      valid: false,
      pnr: booking.pnr,
      ticketRef: booking.ticket_ref,
      bookingStatus: 'CANCELLED',
    })
  }

  if (booking.status === 'EXPIRED' || storedStatus === 'EXP') {
    throw createError('This ticket is expired and not valid for travel', 409, {
      code: 'INVALID_JOURNEY_DATE',
      valid: false,
      pnr: booking.pnr,
      bookingStatus: booking.status,
    })
  }

  const today = formatPgDate(new Date())
  if (storedDate < today) {
    throw createError('Journey date has already passed', 409, {
      code: 'INVALID_JOURNEY_DATE',
      valid: false,
      pnr: booking.pnr,
      journeyDate: storedDate,
    })
  }

  if (qr.statusCode !== storedStatus) {
    throw createError('QR payload does not match stored booking data', 409, {
      code: 'DATA_MISMATCH',
      valid: false,
      fields: ['status'],
    })
  }

  const passengersRes = await pool.query(
    `
    SELECT
      passenger_seq,
      coach_number,
      seat_number,
      berth_type
    FROM booking_passengers
    WHERE booking_id = $1
    ORDER BY passenger_seq ASC
    `,
    [booking.id],
  )

  return {
    valid: true,
    status: booking.status,
    pnr: booking.pnr,
    ticketRef: booking.ticket_ref,
    train: {
      trainNo: booking.train_no,
      trainName: booking.train_name,
    },
    journey: {
      journeyDate: storedDate,
      sourceStation: {
        code: booking.source_station,
        name: booking.source_station_name,
      },
      destinationStation: {
        code: booking.destination_station,
        name: booking.destination_station_name,
      },
    },
    classCode: booking.class_code,
    passengerCount: booking.passenger_count,
    passengers: passengersRes.rows.map((p) => ({
      seq: p.passenger_seq,
      allocation: {
        coachNumber: p.coach_number,
        seatNumber: p.seat_number,
        berthType: p.berth_type,
      },
    })),
    message: 'Ticket is valid',
  }
}

module.exports = {
  getTicketByPnr,
  verifyQrTicket,
  signTicketPayload,
}
