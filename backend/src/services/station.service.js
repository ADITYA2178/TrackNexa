import * as stationModel from "../models/station.model.js"
async function getStations(query = {}) {
  const { search, city, limit, offset } = query

  const [stations, total] = await Promise.all([
    stationModel.findAll({ search, city, limit, offset }),
    stationModel.countAll({ search, city }),
  ])

  return { total, stations }
}

async function getStationByCode(stationCode) {
  if (!stationCode) {
    const error = new Error('Station code is required')
    error.status = 400
    throw error
  }

  const station = await stationModel.findByCode(stationCode)
  if (!station) {
    const error = new Error('Station not found')
    error.status = 404
    throw error
  }

  return station
}

export { getStations, getStationByCode }