import * as trainRouteService from '../services/trainRoute.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const searchTrains = asyncHandler(async (req, res) => {
  const { from, to, date } = req.body || {}

  const data = await trainRouteService.searchTrains({ from, to, date })

  return res.status(200).json(data)
})

const getTrainRoute = asyncHandler(async (req, res) => {
  const { from, to, trainNo } = req.body || {}

  const data = await trainRouteService.getTrainRoute({ from, to, trainNo })

  return res.status(200).json(data)
})

export { searchTrains, getTrainRoute }
