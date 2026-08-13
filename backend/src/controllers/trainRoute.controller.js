const trainRouteService = require('../services/trainRoute.service')

async function searchTrains(req, res) {
  try {
    const { from, to, date } = req.body || {}

    const data = await trainRouteService.searchTrains({ from, to, date })

    return res.status(200).json(data)
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
    })
  }
}

async function getTrainRoute(req, res) {
  try {
    const { from, to, trainNo } = req.body || {}

    const data = await trainRouteService.getTrainRoute({ from, to, trainNo })

    return res.status(200).json(data)
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
    })
  }
}

module.exports = {
  searchTrains,
  getTrainRoute,
}
