const seatAvailabilityModel = require('../models/seatAvailability.model')

const ALLOWED_CLASSES = new Set([
  '1A',
  '2A',
  '3A',
  '3E',
  'SL',
  'CC',
  'EC',
  '2S',
])

function createError(message, status, extra = {}) {
  const error = new Error(message)
  error.status = status
  Object.assign(error, extra)
  return error
}

function isValidDate(date) {
  if (!date || typeof date !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(`${date}T00:00:00`)
  return !Number.isNaN(parsed.getTime())
}

async function getSeatAvailability({
  trainId,
  journeyDate,
  sourceStation,
  destinationStation,
  classCode,
}) {
  if (
    !trainId ||
    !journeyDate ||
    !sourceStation ||
    !destinationStation ||
    !classCode
  ) {
    throw createError(
      'trainId, journeyDate, sourceStation, destinationStation, and classCode are required',
      400,
    )
  }

  if (!isValidDate(journeyDate)) {
    throw createError('journeyDate must be in YYYY-MM-DD format', 400)
  }

  const normalizedClass = String(classCode).trim().toUpperCase()
  if (!ALLOWED_CLASSES.has(normalizedClass)) {
    throw createError(
      `Invalid classCode. Allowed: ${[...ALLOWED_CLASSES].join(', ')}`,
      400,
    )
  }

  const trainNo = String(trainId).trim()
  const source = String(sourceStation).trim()
  const destination = String(destinationStation).trim()

  if (source.toUpperCase() === destination.toUpperCase()) {
    throw createError('sourceStation and destinationStation must be different', 400)
  }

  const exists = await seatAvailabilityModel.trainExists(trainNo)
  if (!exists) {
    throw createError(`Train ${trainNo} not found`, 404)
  }

  const fromStop = await seatAvailabilityModel.findStationSeq(trainNo, source)
  if (!fromStop) {
    throw createError(
      `Source station "${source}" not found on train ${trainNo}`,
      404,
    )
  }

  const toStop = await seatAvailabilityModel.findStationSeq(
    trainNo,
    destination,
  )
  if (!toStop) {
    throw createError(
      `Destination station "${destination}" not found on train ${trainNo}`,
      404,
    )
  }

  if (fromStop.seq >= toStop.seq) {
    throw createError(
      'Destination comes before source on this train route',
      400,
    )
  }

  const client = await seatAvailabilityModel.pool.connect()
  try {
    await client.query('BEGIN')
    // Transaction-safe read of inventory + overlapping reservations
    await client.query(
      `
      SELECT 1
      FROM train_coaches
      WHERE train_no = $1 AND UPPER(class_code) = UPPER($2) AND is_active = TRUE
      FOR SHARE
      `,
      [trainNo, normalizedClass],
    )

    const coaches = await seatAvailabilityModel.getCoachAvailability(client, {
      trainNo,
      journeyDate,
      classCode: normalizedClass,
      sourceSeq: fromStop.seq,
      destinationSeq: toStop.seq,
    })

    await client.query('COMMIT')

    if (!coaches.length) {
      throw createError(
        `Class ${normalizedClass} is not available on train ${trainNo}`,
        404,
        { code: 'CLASS_NOT_AVAILABLE' },
      )
    }

    const totals = coaches.reduce(
      (acc, coach) => {
        acc.totalSeats += coach.total_seats
        acc.bookedSeats += coach.booked_seats
        acc.heldSeats += coach.held_seats
        acc.availableSeats += coach.available_seats
        return acc
      },
      { totalSeats: 0, bookedSeats: 0, heldSeats: 0, availableSeats: 0 },
    )

    const response = {
      trainId: trainNo,
      journeyDate,
      sourceStation: {
        code: fromStop.station_code,
        name: fromStop.station_name,
        seq: fromStop.seq,
      },
      destinationStation: {
        code: toStop.station_code,
        name: toStop.station_name,
        seq: toStop.seq,
      },
      classCode: normalizedClass,
      totalSeats: totals.totalSeats,
      bookedSeats: totals.bookedSeats,
      heldSeats: totals.heldSeats,
      availableSeats: totals.availableSeats,
      status:
        totals.availableSeats > 0 ? 'AVAILABLE' : 'NOT_AVAILABLE',
      message:
        totals.availableSeats > 0
          ? `${totals.availableSeats} seats available in ${normalizedClass}`
          : `No seats available in ${normalizedClass} for this journey segment`,
      coaches: coaches.map((coach) => ({
        coachId: coach.coach_id,
        coachNumber: coach.coach_number,
        classCode: coach.class_code,
        positionSeq: coach.position_seq,
        totalSeats: coach.total_seats,
        bookedSeats: coach.booked_seats,
        heldSeats: coach.held_seats,
        availableSeats: coach.available_seats,
      })),
    }

    return response
  } catch (err) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // ignore rollback errors
    }
    throw err
  } finally {
    client.release()
  }
}

module.exports = {
  getSeatAvailability,
}
