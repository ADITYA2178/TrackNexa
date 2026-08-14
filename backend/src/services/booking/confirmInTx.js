import { createError } from "../../utils/httpError.js"
import { generatePnr } from "./ids.js"
import { getTrainName } from "./stations.js"
import { loadPassengers, mapTicketResponse } from "./passengers.js"
const insertUniquePnr = async (client, bookingId) => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const pnr = generatePnr()
    try {
      const result = await client.query(
        `
        UPDATE bookings
        SET pnr = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING pnr
        `,
        [pnr, bookingId],
      )
      return result.rows[0].pnr
    } catch (err) {
      if (err.code === '23505') continue // unique_violation — retry
      throw err
    }
  }
  throw createError('Unable to generate unique PNR', 500, { code: 'PNR_GENERATION_FAILED' })
}

/**
 * Confirm a locked HELD booking inside an open transaction.
 * Caller must BEGIN and FOR UPDATE the booking row.
 */
const confirmHeldBookingInTx = async (client, booking) => {
  if (booking.status === 'CONFIRMED' && booking.pnr) {
    const trainName = await getTrainName(client, booking.train_no)
    const passengers = await loadPassengers(client, booking.id)
    return mapTicketResponse(booking, {
      pnr: booking.pnr,
      trainName,
      passengers,
    })
  }

  if (booking.status !== 'HELD') {
    throw createError(`Booking status "${booking.status}" cannot be confirmed`, 409, {
      code: 'INVALID_BOOKING_STATUS',
    })
  }

  const expiryCheck = await client.query(
    `
    SELECT (held_until IS NOT NULL AND held_until <= NOW()) AS is_expired
    FROM bookings
    WHERE id = $1
    `,
    [booking.id],
  )

  if (expiryCheck.rows[0]?.is_expired === true) {
    await client.query(
      `
      UPDATE bookings
      SET status = 'EXPIRED', updated_at = NOW()
      WHERE id = $1
      `,
      [booking.id],
    )
    await client.query(
      `
      UPDATE seat_reservations
      SET status = 'EXPIRED', updated_at = NOW()
      WHERE booking_id = $1 AND status = 'HELD'
      `,
      [booking.id],
    )
    const err = createError('Hold has expired and cannot be confirmed', 410, {
      code: 'HOLD_EXPIRED',
    })
    err.holdExpiredInTx = true
    throw err
  }

  const reservationUpdate = await client.query(
    `
    UPDATE seat_reservations
    SET status = 'CONFIRMED',
        held_until = NULL,
        updated_at = NOW()
    WHERE booking_id = $1
      AND status = 'HELD'
    RETURNING id
    `,
    [booking.id],
  )

  if (!reservationUpdate.rowCount) {
    throw createError('No active held seats found for this booking', 409, {
      code: 'NO_HELD_SEATS',
    })
  }

  await client.query(
    `
    UPDATE bookings
    SET status = 'CONFIRMED',
        held_until = NULL,
        updated_at = NOW()
    WHERE id = $1
    `,
    [booking.id],
  )

  const pnr = booking.pnr || (await insertUniquePnr(client, booking.id))
  const trainName = await getTrainName(client, booking.train_no)
  const passengers = await loadPassengers(client, booking.id)

  return mapTicketResponse(
    { ...booking, status: 'CONFIRMED', pnr },
    { pnr, trainName, passengers },
  )
}

const getConfirmedTicketByBookingId = async (client, bookingId) => {
  const bookingRes = await client.query(
    `SELECT * FROM bookings WHERE id = $1`,
    [bookingId],
  )
  if (!bookingRes.rowCount) {
    throw createError('Booking not found', 404, { code: 'BOOKING_NOT_FOUND' })
  }
  const booking = bookingRes.rows[0]
  const trainName = await getTrainName(client, booking.train_no)
  const passengers = await loadPassengers(client, booking.id)
  return mapTicketResponse(booking, {
    pnr: booking.pnr,
    trainName,
    passengers,
  })
}

export { insertUniquePnr, confirmHeldBookingInTx, getConfirmedTicketByBookingId }