const seatAvailabilityService = require('../services/seatAvailability.service')

async function getAvailability(req, res) {
  try {
    const {
      trainId,
      journeyDate,
      sourceStation,
      destinationStation,
      classCode,
    } = req.body || {}

    const data = await seatAvailabilityService.getSeatAvailability({
      trainId,
      journeyDate,
      sourceStation,
      destinationStation,
      classCode,
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

module.exports = {
  getAvailability,
}
