const bookingService = require('../services/booking.service')
const ticketService = require('../services/ticket.service')

async function createHold(req, res) {
  try {
    const {
      trainId,
      journeyDate,
      sourceStation,
      destinationStation,
      classCode,
      passengers,
      userId,
    } = req.body || {}

    const data = await bookingService.createSeatHold({
      trainId,
      journeyDate,
      sourceStation,
      destinationStation,
      classCode,
      passengers,
      userId,
    })

    return res.status(201).json(data)
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
      ...(err.code ? { code: err.code } : {}),
    })
  }
}

async function confirmHold(req, res) {
  try {
    const { holdId, userId } = req.body || {}

    const data = await bookingService.confirmSeatHold({
      holdId,
      userId,
    })

    return res.status(200).json(data)
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
      ...(err.code ? { code: err.code } : {}),
      ...(err.pnr ? { pnr: err.pnr } : {}),
      ...(err.bookingId ? { bookingId: err.bookingId } : {}),
    })
  }
}

async function getByPnr(req, res) {
  try {
    const data = await bookingService.getBookingByPnr(req.params.pnr)
    return res.status(200).json(data)
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
      ...(err.code ? { code: err.code } : {}),
    })
  }
}

async function cancelBooking(req, res) {
  try {
    const { pnr, userId, reason } = req.body || {}

    const data = await bookingService.cancelBookingByPnr({
      pnr,
      userId,
      reason,
    })

    return res.status(200).json(data)
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
      ...(err.code ? { code: err.code } : {}),
      ...(err.cancelledAt ? { cancelledAt: err.cancelledAt } : {}),
      ...(err.refundAmount != null ? { refundAmount: err.refundAmount } : {}),
    })
  }
}

async function getByUser(req, res) {
  try {
    const data = await bookingService.getBookingsByUserId(req.params.userId, {
      status: req.query.status,
      journey: req.query.journey,
    })
    return res.status(200).json(data)
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
      ...(err.code ? { code: err.code } : {}),
    })
  }
}

async function getTicket(req, res) {
  try {
    const result = await ticketService.getTicketByPnr(req.params.pnr)
    const format = String(req.query.format || '').toLowerCase()
    const accept = String(req.headers.accept || '')
    const wantsPdf = format === 'pdf' || accept.includes('application/pdf')

    if (wantsPdf) {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.filename}"`,
      )
      return res.status(200).send(result.pdfBuffer)
    }

    return res.status(200).json(result.ticket)
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
      ...(err.code ? { code: err.code } : {}),
    })
  }
}

module.exports = {
  createHold,
  confirmHold,
  getByPnr,
  cancelBooking,
  getByUser,
  getTicket,
}
