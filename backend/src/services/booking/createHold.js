import { pool } from "../../config/db.js"
import { createError } from "../../utils/httpError.js"
import { HOLD_MINUTES } from "./constants.js"
import { generateHoldId } from "./ids.js"
import { getFareRate, calculateFare } from "./fare.js"
import { findStationSeq } from "./stations.js"
import { allocateSeats, persistHoldAllocations } from "./allocateSeats.js"
import { validateHoldInput } from "./validateHold.js"
import { mapHoldResponse } from "./passengers.js"
const createSeatHold = async ({
  trainId,
  journeyDate,
  sourceStation,
  destinationStation,
  classCode,
  passengers,
  userId = null,
}) => {
  const {
    trainNo,
    source,
    destination,
    normalizedClass,
    normalizedPassengers,
  } = validateHoldInput({
    trainId,
    journeyDate,
    sourceStation,
    destinationStation,
    classCode,
    passengers,
  })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const trainCheck = await client.query(
      `SELECT 1 FROM train_routes WHERE train_no = $1 LIMIT 1`,
      [trainNo],
    )
    if (!trainCheck.rowCount) {
      throw createError(`Train ${trainNo} not found`, 404)
    }

    const classCheck = await client.query(
      `
      SELECT COUNT(*)::int AS coaches
      FROM train_coaches
      WHERE train_no = $1 AND UPPER(class_code) = $2 AND is_active = TRUE
      `,
      [trainNo, normalizedClass],
    )
    if (!classCheck.rows[0].coaches) {
      throw createError(
        `Class ${normalizedClass} is not available on train ${trainNo}`,
        404,
        { code: 'CLASS_NOT_AVAILABLE' },
      )
    }

    const fromStop = await findStationSeq(client, trainNo, source)
    if (!fromStop) {
      throw createError(
        `Source station "${source}" not found on train ${trainNo}`,
        404,
      )
    }
    const toStop = await findStationSeq(client, trainNo, destination)
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

    const distanceKm = Math.max(
      Number(toStop.distance || 0) - Number(fromStop.distance || 0),
      0,
    )
    const rate = await getFareRate(client, normalizedClass)
    const farePerPassenger = calculateFare(
      distanceKm,
      rate.base_fare,
      rate.per_km_rate,
    )
    const totalFare =
      Math.round(farePerPassenger * normalizedPassengers.length * 100) / 100

    const allocations = await allocateSeats(client, {
      trainNo,
      journeyDate,
      classCode: normalizedClass,
      sourceSeq: fromStop.seq,
      destinationSeq: toStop.seq,
      passengers: normalizedPassengers,
    })

    const holdId = generateHoldId()
    const heldUntilRes = await client.query(
      `SELECT NOW() + ($1 || ' minutes')::interval AS held_until`,
      [String(HOLD_MINUTES)],
    )
    const heldUntil = heldUntilRes.rows[0].held_until

    const bookingRes = await client.query(
      `
      INSERT INTO bookings (
        hold_id, train_no, journey_date,
        source_station, destination_station, source_seq, destination_seq,
        class_code, status, passenger_count,
        distance_km, fare_per_passenger, total_fare,
        held_until, user_id
      )
      VALUES (
        $1, $2, $3::date, $4, $5, $6, $7, $8, 'HELD', $9,
        $10, $11, $12, $13, $14
      )
      RETURNING *
      `,
      [
        holdId, trainNo, journeyDate,
        fromStop.station_code, toStop.station_code, fromStop.seq, toStop.seq,
        normalizedClass, normalizedPassengers.length,
        distanceKm, farePerPassenger, totalFare, heldUntil, userId,
      ],
    )
    const booking = bookingRes.rows[0]

    const passengerResults = await persistHoldAllocations(client, {
      allocations,
      trainNo,
      journeyDate,
      normalizedClass,
      fromStop,
      toStop,
      heldUntil,
      holdId,
      bookingId: booking.id,
      userId,
    })

    await client.query('COMMIT')

    return mapHoldResponse({
      booking,
      journeyDate,
      fromStop,
      toStop,
      normalizedClass,
      passengerResults,
      distanceKm,
      farePerPassenger,
      totalFare,
      rate,
      passengerCount: normalizedPassengers.length,
    })
  } catch (err) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // ignore
    }
    throw err
  } finally {
    client.release()
  }
}

export { createSeatHold }