const { query } = require('../config/db')

async function findAll({ search, city, limit = 50, offset = 0 } = {}) {
  const params = []
  const where = []

  if (search) {
    params.push(`%${search}%`)
    where.push(
      `(station_name ILIKE $${params.length} OR station_code ILIKE $${params.length} OR city ILIKE $${params.length})`,
    )
  }

  if (city) {
    params.push(city)
    where.push(`city ILIKE $${params.length}`)
  }

  params.push(Math.min(Number(limit) || 50, 500))
  params.push(Number(offset) || 0)

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const result = await query(
    `SELECT id, station_code, station_name, city
     FROM stations
     ${whereSql}
     ORDER BY station_name ASC
     LIMIT $${params.length - 1}
     OFFSET $${params.length}`,
    params,
  )

  return result.rows
}

async function findByCode(stationCode) {
  const result = await query(
    `SELECT id, station_code, station_name, city
     FROM stations
     WHERE station_code = $1`,
    [stationCode.toUpperCase()],
  )

  return result.rows[0] || null
}

async function countAll({ search, city } = {}) {
  const params = []
  const where = []

  if (search) {
    params.push(`%${search}%`)
    where.push(
      `(station_name ILIKE $${params.length} OR station_code ILIKE $${params.length} OR city ILIKE $${params.length})`,
    )
  }

  if (city) {
    params.push(city)
    where.push(`city ILIKE $${params.length}`)
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
