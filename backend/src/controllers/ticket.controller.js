import * as ticketService from '../services/ticket.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { createError } from '../utils/httpError.js'

/**
 * Ticket verify keeps a thin catch so error JSON always includes
 * `valid: false` and maps `bookingStatus` → `status`.
 */
const verify = asyncHandler(async (req, res) => {
  try {
    const data = await ticketService.verifyQrTicket(req.body || {})
    return res.status(200).json(data)
  } catch (err) {
    const error = createError(err.message || 'Something went wrong', err.status || 500, {
      valid: false,
      ...(err.code ? { code: err.code } : {}),
      ...(err.fields ? { fields: err.fields } : {}),
      ...(err.pnr ? { pnr: err.pnr } : {}),
      ...(err.ticketRef ? { ticketRef: err.ticketRef } : {}),
      ...(err.bookingStatus
        ? { bookingStatus: err.bookingStatus, mapBookingStatusToStatus: true }
        : {}),
      ...(err.journeyDate ? { journeyDate: err.journeyDate } : {}),
    })
    throw error
  }
})

export { verify }
