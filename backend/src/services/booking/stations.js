const findStationSeq = async (client, trainNo, station) => {
  const result = await client.query(
    `
    SELECT CAST(seq AS INTEGER) AS seq, station_code, station_name,
           CAST(NULLIF(TRIM(distance), '') AS NUMERIC) AS distance
    FROM train_routes
    WHERE train_no = $1
      AND (
        UPPER(station_code) = UPPER($2)
        OR LOWER(station_name) = LOWER($2)
      )
    ORDER BY CAST(seq AS INTEGER) ASC
    LIMIT 1
    `,
    [trainNo, station],
  )
  return result.rows[0] || null
}

const getTrainName = async (client, trainNo) => {
  const result = await client.query(
    `
    SELECT train_name
    FROM train_routes
    WHERE train_no = $1
    ORDER BY CAST(seq AS INTEGER) ASC
    LIMIT 1
    `,
    [trainNo],
  )
  return result.rows[0]?.train_name || null
}

export { findStationSeq, getTrainName }