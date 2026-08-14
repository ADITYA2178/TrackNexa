async function markPaymentFailed(client, payment, reason) {
  const result = await client.query(
    `
    UPDATE payments
    SET status = 'FAILED',
        failure_reason = $2,
        updated_at = NOW()
    WHERE id = $1
      AND status = 'PENDING'
    RETURNING *
    `,
    [payment.id, reason],
  )
  return result.rows[0] || payment
}

async function applyHoldExpiryIfNeeded(client, booking) {
  const expiryCheck = await client.query(
    `
    SELECT (held_until IS NOT NULL AND held_until <= NOW()) AS is_expired
    FROM bookings
    WHERE id = $1
    `,
    [booking.id],
  )

  if (!expiryCheck.rows[0]?.is_expired) {
    return { expired: false, booking }
  }

  await client.query(
    `
    UPDATE bookings
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE id = $1 AND status = 'HELD'
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

  return {
    expired: true,
    booking: { ...booking, status: 'EXPIRED' },
  }
}

export { markPaymentFailed, applyHoldExpiryIfNeeded }