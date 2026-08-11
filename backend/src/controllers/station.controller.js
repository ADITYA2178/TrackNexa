const stationService = require('../services/station.service')

async function listStations(req, res) {
  try {
    const { search, city, limit, offset } = req.query
    const data = await stationService.getStations({
      search,
      city,
      limit,
      offset,
    })

    return res.status(200).json(data)
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
    })
  }
}

async function getStation(req, res) {
  try {
    const station = await stationService.getStationByCode(req.params.code)
    return res.status(200).json({ station })
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
    })
  }
}

module.exports = {
  listStations,
  getStation,
}
