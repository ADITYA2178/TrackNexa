import * as stationService from '../services/station.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const listStations = asyncHandler(async (req, res) => {
  const { search, city, limit, offset } = req.query
  const data = await stationService.getStations({
    search,
    city,
    limit,
    offset,
  })

  return res.status(200).json(data)
})

const getStation = asyncHandler(async (req, res) => {
  const station = await stationService.getStationByCode(req.params.code)
  return res.status(200).json({ station })
})

export { listStations, getStation }
