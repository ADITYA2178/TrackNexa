const { query } = require('../config/db')

function normalizeSearch(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
}

async function findAll({ search, city, limit = 50, offset = 0 } = {}) {
  const params = []
  const where = []
  let orderBy = 'station_name ASC'
  let selectExtra = ''

  if (search) {
    const term = normalizeSearch(search)
    const likeIdx = params.push(`%${term}%`)
    const exactIdx = params.push(term)
    const prefixIdx = params.push(`${term}%`)
    const wordIdx = params.push(`% ${term}%`)

    where.push(`(
      station_name ILIKE $${likeIdx}
      OR station_code ILIKE $${likeIdx}
      OR city ILIKE $${likeIdx}
      OR similarity(station_name, $${exactIdx}) > 0.25
      OR similarity(city, $${exactIdx}) > 0.3
    )`)

    selectExtra = `,
      CASE
        WHEN LOWER(station_name) = LOWER($${exactIdx}) THEN 0
        WHEN LOWER(REGEXP_REPLACE(station_name, '\\s+(JN\\.?|JUNCTION|JN)$', '', 'i')) = LOWER($${exactIdx}) THEN 1
        WHEN LOWER(SPLIT_PART(station_name, ' ', 1)) = LOWER($${exactIdx}) THEN 2
        WHEN SPLIT_PART(station_name, ' ', 1) ILIKE $${prefixIdx}
          AND city ILIKE $${prefixIdx} THEN 3
        WHEN SPLIT_PART(station_name, ' ', 1) ILIKE $${prefixIdx} THEN 4
        WHEN UPPER(station_code) = UPPER($${exactIdx}) THEN 5
        WHEN station_name ILIKE $${prefixIdx} THEN 6
        WHEN station_name ILIKE $${wordIdx} THEN 7
        WHEN LOWER(city) = LOWER($${exactIdx}) THEN 8
        WHEN city ILIKE $${prefixIdx} THEN 9
        WHEN similarity(station_name, $${exactIdx}) >= 0.4 THEN 10
        WHEN city ILIKE $${likeIdx} THEN 11
        WHEN station_code ILIKE $${likeIdx} THEN 12
        ELSE 13
      END AS rank_score,
      GREATEST(
        similarity(SPLIT_PART(station_name, ' ', 1), $${exactIdx}),
        similarity(station_name, $${exactIdx}) * 0.9,
        CASE WHEN city ILIKE $${prefixIdx} THEN 0.88 ELSE 0 END,
        CASE WHEN UPPER(station_code) = UPPER($${exactIdx}) THEN 0.95 ELSE 0 END,
        similarity(city, $${exactIdx}) * 0.8,
        similarity(station_code, $${exactIdx}) * 0.6
      ) AS match_score
    `

    orderBy = `
      rank_score ASC,
      match_score DESC,
      LENGTH(station_name) ASC,
      station_name ASC
    `
  }

  if (city) {
    const cityTerm = normalizeSearch(city)
    const cityIdx = params.push(`%${cityTerm}%`)
    where.push(`city ILIKE $${cityIdx}`)
  }

  const limitIdx = params.push(Math.min(Number(limit) || 50, 500))
  const offsetIdx = params.push(Number(offset) || 0)
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const result = await query(
    `
    SELECT id, station_code, station_name, city
    FROM (
      SELECT
        id,
        station_code,
        station_name,
        city
        ${selectExtra}
      FROM stations
      ${whereSql}
    ) ranked
    ORDER BY ${orderBy}
    LIMIT $${limitIdx}
    OFFSET $${offsetIdx}
    `,
    params,
  )

  return result.rows
}

async function findByCode(stationCode) {
  const result = await query(
    `SELECT id, station_code, station_name, city
     FROM stations
     WHERE UPPER(station_code) = UPPER($1)`,
    [stationCode],
  )

  return result.rows[0] || null
}

async function countAll({ search, city } = {}) {
  const params = []
  const where = []

  if (search) {
    const term = normalizeSearch(search)
    const likeIdx = params.push(`%${term}%`)
    const exactIdx = params.push(term)
    where.push(`(
      station_name ILIKE $${likeIdx}
      OR station_code ILIKE $${likeIdx}
      OR city ILIKE $${likeIdx}
      OR similarity(station_name, $${exactIdx}) > 0.25
      OR similarity(city, $${exactIdx}) > 0.3
    )`)
  }

  if (city) {
    const cityIdx = params.push(`%${normalizeSearch(city)}%`)
    where.push(`city ILIKE $${cityIdx}`)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM stations ${whereSql}`,
    params,
  )

  return result.rows[0].count
}

module.exports = {
  findAll,
  findByCode,
  countAll,
}
