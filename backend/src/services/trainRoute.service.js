const trainRouteModel = require('../models/trainRoute.model')

function isValidDate(date) {
  if (!date || typeof date !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(`${date}T00:00:00`)
  return !Number.isNaN(parsed.getTime())
}

function timeToMinutes(time) {
  if (!time) return null
  const [hh, mm, ss = 0] = String(time).split(':').map(Number)
  if ([hh, mm, ss].some((n) => Number.isNaN(n))) return null
  return hh * 60 + mm
}

function formatDurationFromMinutes(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined) return null
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

function formatDuration(departureTime, arrivalTime) {
  const start = timeToMinutes(departureTime)
  const end = timeToMinutes(arrivalTime)
  if (start === null || end === null) return null

  let diff = end - start
  if (diff < 0) diff += 24 * 60
  return formatDurationFromMinutes(diff)
}

function formatHalt(arrivalTime, departureTime, isFirst, isLast) {
  if (isFirst || isLast) return '0m'

  const arrival = String(arrivalTime || '')
  const departure = String(departureTime || '')
  if (!arrival || !departure || arrival === '00:00:00' || departure === '00:00:00') {
    return '0m'
  }

  const start = timeToMinutes(arrival)
  const end = timeToMinutes(departure)
  if (start === null || end === null) return '0m'

  let diff = end - start
  if (diff < 0) diff += 24 * 60
  return `${diff}m`
}

function createError(message, status) {
  const error = new Error(message)
  error.status = status
  return error
}

async function searchTrains({ from, to, date }) {
  if (!from || !to || !date) {
    throw createError('from, to, and date are required', 400)
  }

  if (!isValidDate(date)) {
    throw createError('date must be in YYYY-MM-DD format', 400)
  }

  if (String(from).trim().toUpperCase() === String(to).trim().toUpperCase()) {
    throw createError('from and to stations must be different', 400)
  }

  const rows = await trainRouteModel.findTrainsBetween({
    from: String(from).trim(),
    to: String(to).trim(),
  })

  const trains = rows.map((row) => {
    const distance =
      row.distance !== null && row.distance !== undefined
        ? Number(row.distance)
        : null

    return {
      trainNo: row.train_no,
      trainName: row.train_name,
      journeyDate: date,
      from: {
        code: row.from_station_code,
        name: row.from_station_name,
        departureTime: row.departure_time,
        seq: row.from_seq,
      },
      to: {
        code: row.to_station_code,
        name: row.to_station_name,
        arrivalTime: row.arrival_time,
        seq: row.to_seq,
      },
      duration: formatDuration(row.departure_time, row.arrival_time),
      distance,
      sourceStation: {
        code: row.source_station,
        name: row.source_station_name,
      },
      destinationStation: {
        code: row.destination_station,
        name: row.destination_station_name,
      },
    }
  })

  return {
    from: String(from).trim(),
    to: String(to).trim(),
    date,
    total: trains.length,
    trains,
  }
}

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

module.exports = {
  searchTrains,
  getTrainRoute,
}
