import PDFDocument from "pdfkit"
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
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Track Nexa Ticket ${ticket.pnr}`,
        Author: 'Track Nexa',
      },
    })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    drawPdf(doc, ticket, qrPng)
    doc.end()
  })
}

export { drawPdf, buildPdfBuffer }