import * as trainRouteModel from "../../models/trainRoute.model.js"
import { createError } from "../../utils/httpError.js"
import { isValidDate } from "../../utils/dates.js"
import { formatDuration } from "./time.js"
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

export { searchTrains }