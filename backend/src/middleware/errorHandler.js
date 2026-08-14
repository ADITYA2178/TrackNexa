const EXTRA_KEYS = [
  'code',
  'pnr',
  'bookingId',
  'cancelledAt',
  'paymentId',
  'orderId',
  'paymentStatus',
  'bookingStatus',
  'fields',
  'ticketRef',
  'journeyDate',
  'errors',
]

/**
 * Central Express error handler. Preserves status/code/message and
 * spreads known extra fields attached via createError(..., extras).
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  const status = err.status || 500
  const body = {
    message: err.message || 'Something went wrong',
  }

  if (err.valid === false) {
    body.valid = false
  }

  for (const key of EXTRA_KEYS) {
    if (err[key] !== undefined && err[key] !== null && err[key] !== '') {
      body[key] = err[key]
    }
  }

  if (err.refundAmount != null) {
    body.refundAmount = err.refundAmount
  }

  // Ticket verify maps bookingStatus → status in the JSON body
  if (err.mapBookingStatusToStatus && err.bookingStatus) {
    body.status = err.bookingStatus
    delete body.bookingStatus
  }

  return res.status(status).json(body)
}

export default errorHandler
