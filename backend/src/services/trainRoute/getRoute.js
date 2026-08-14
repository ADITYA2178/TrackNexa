import * as trainRouteModel from "../../models/trainRoute.model.js"
import { createError } from "../../utils/httpError.js"
import { formatDuration, formatHalt } from "./time.js"
async function getTrainRoute({ from, to, trainNo }) {
  if (!from || !to || !trainNo) {
    throw createError('from, to, and trainNo are required', 400)
  }

  const source = String(from).trim()
  const destination = String(to).trim()
  const train = String(trainNo).trim()

  if (source.toUpperCase() === destination.toUpperCase()) {
    throw createError('from and to stations must be different', 400)
  }

  const exists = await trainRouteModel.trainExists(train)
  if (!exists) {
    throw createError(`Train ${train} not found`, 404)
  }

  const fromStop = await trainRouteModel.findStationOnTrain(train, source)
  if (!fromStop) {
    throw createError(
      `Source station "${source}" not found on train ${train}`,
      404,
    )
  }

  const toStop = await trainRouteModel.findStationOnTrain(train, destination)
  if (!toStop) {
    throw createError(
      `Destination station "${destination}" not found on train ${train}`,
      404,
    )
  }

  if (fromStop.seq > toStop.seq) {
    throw createError(
      'Destination comes before source on this train route',
      400,
    )
  }

  if (fromStop.seq === toStop.seq) {
    throw createError('from and to resolve to the same stop on this train', 400)
  }

  const stops = await trainRouteModel.findStopsBetween({
    trainNo: train,
    fromSeq: fromStop.seq,
    toSeq: toStop.seq,
  })

  if (!stops.length) {
    throw createError('No route stops found between the selected stations', 404)
  }

  const sourceDistance = Number(fromStop.distance || 0)
  const stations = stops.map((stop, index) => {
    const stopDistance = Number(stop.distance || 0)
    const previousDistance =
      index === 0 ? sourceDistance : Number(stops[index - 1].distance || 0)

    const distanceFromPrevious =
      index === 0 ? 0 : Math.max(stopDistance - previousDistance, 0)
    const cumulativeDistance = Math.max(stopDistance - sourceDistance, 0)

    return {
      seq: stop.seq,
      stationCode: stop.station_code,
      stationName: stop.station_name,
      arrivalTime: stop.arrival_time,
      departureTime: stop.departure_time,
      haltDuration: formatHalt(
        stop.arrival_time,
        stop.departure_time,
        index === 0,
        index === stops.length - 1,
      ),
      distanceFromPrevious,
      cumulativeDistance,
    }
  })

  const totalDistance = Math.max(
    Number(toStop.distance || 0) - sourceDistance,
    0,
  )
  const totalDuration = formatDuration(
    fromStop.departure_time,
    toStop.arrival_time,
  )

  return {
    trainNo: fromStop.train_no,
    trainName: fromStop.train_name,
    from: {
      code: fromStop.station_code,
      name: fromStop.station_name,
      departureTime: fromStop.departure_time,
      seq: fromStop.seq,
    },
    to: {
      code: toStop.station_code,
      name: toStop.station_name,
      arrivalTime: toStop.arrival_time,
      seq: toStop.seq,
    },
    totalDistance,
    totalDuration,
    totalStops: stations.length,
    stations,
  }
}

export { getTrainRoute }