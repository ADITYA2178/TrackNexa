import * as bookingService from '../services/booking.service.js'
import * as ticketService from '../services/ticket.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const createHold = asyncHandler(async (req, res) => {
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
})

const confirmHold = asyncHandler(async (req, res) => {
  const { holdId, userId } = req.body || {}

  const data = await bookingService.confirmSeatHold({
    holdId,
    userId,
  })

  return res.status(200).json(data)
})

const getByPnr = asyncHandler(async (req, res) => {
  const data = await bookingService.getBookingByPnr(req.params.pnr)
  return res.status(200).json(data)
})

const cancelBooking = asyncHandler(async (req, res) => {
  const { pnr, userId, reason } = req.body || {}

  const data = await bookingService.cancelBookingByPnr({
    pnr,
    userId,
    reason,
  })

  return res.status(200).json(data)
})

const getByUser = asyncHandler(async (req, res) => {
  const data = await bookingService.getBookingsByUserId(req.params.userId, {
    status: req.query.status,
    journey: req.query.journey,
  })
  return res.status(200).json(data)
})

const getTicket = asyncHandler(async (req, res) => {
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
})

export {
  createHold,
  confirmHold,
  getByPnr,
  cancelBooking,
  getByUser,
  getTicket,
}
