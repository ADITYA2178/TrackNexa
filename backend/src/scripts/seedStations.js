import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function seedStations() {
  const client = await pool.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS stations (
        id SERIAL PRIMARY KEY,
        station_code VARCHAR(10) NOT NULL UNIQUE,
        station_name VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_stations_name ON stations (station_name);
      CREATE INDEX IF NOT EXISTS idx_stations_city ON stations (city);
      CREATE INDEX IF NOT EXISTS idx_stations_code ON stations (station_code);
    `)

    const filePath = path.join(__dirname, '../data/railwayStationsList.json')
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const stations = raw.stations || raw

    console.log(`Seeding ${stations.length} stations...`)

    await client.query('BEGIN')
    await client.query('TRUNCATE TABLE stations RESTART IDENTITY')

    const batchSize = 500
    for (let i = 0; i < stations.length; i += batchSize) {
      const batch = stations.slice(i, i + batchSize)
      const values = []
      const params = []

      batch.forEach((station, index) => {
        const offset = index * 3
        values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`)
        params.push(
          String(station.stnCode).trim().toUpperCase(),
          String(station.stnName).trim(),
          String(station.stnCity).trim(),
        )
      })

      await client.query(
        `INSERT INTO stations (station_code, station_name, city)
         VALUES ${values.join(', ')}
         ON CONFLICT (station_code) DO UPDATE
         SET station_name = EXCLUDED.station_name,
             city = EXCLUDED.city`,
        params,
      )
    }

    await client.query('COMMIT')

    const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM stations')
    console.log(`Done. Stations in database: ${rows[0].count}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Seed failed:', err.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

seedStations()
