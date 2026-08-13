const ticketService = require('../services/ticket.service')

async function verify(req, res) {
  try {
    const data = await ticketService.verifyQrTicket(req.body || {})
    return res.status(200).json(data)
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      valid: false,
      message: err.message || 'Something went wrong',
      ...(err.code ? { code: err.code } : {}),
      ...(err.fields ? { fields: err.fields } : {}),
      ...(err.pnr ? { pnr: err.pnr } : {}),
      ...(err.ticketRef ? { ticketRef: err.ticketRef } : {}),
      ...(err.bookingStatus ? { status: err.bookingStatus } : {}),
      ...(err.journeyDate ? { journeyDate: err.journeyDate } : {}),
    })
  }
}

module.exports = {
  verify,
}
