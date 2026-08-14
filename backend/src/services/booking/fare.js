const getFareRate = async (client, classCode) => {
  const result = await client.query(
    `
    SELECT base_fare, per_km_rate
    FROM class_fare_rates
    WHERE class_code = $1
    `,
    [classCode],
  )
  return result.rows[0] || { base_fare: 0, per_km_rate: 0 }
}

const calculateFare = (distanceKm, baseFare, perKmRate) => {
  const distance = Math.max(Number(distanceKm) || 0, 0)
  const fare = Number(baseFare) + distance * Number(perKmRate)
  return Math.round(fare * 100) / 100
}

export { getFareRate, calculateFare }