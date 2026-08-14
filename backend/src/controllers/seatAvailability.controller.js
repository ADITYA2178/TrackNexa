import * as seatAvailabilityService from '../services/seatAvailability.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const getAvailability = asyncHandler(async (req, res) => {
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
})

export { getAvailability }
