import { Pool } from 'pg'
import { db } from './index.js'

const pool = new Pool({
  host: db.host,
  port: db.port,
  database: db.database,
  user: db.user,
  password: db.password,
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message)
})

async function connectDB() {
  const client = await pool.connect()
  try {
    await client.query('SELECT 1')
    console.log(
      `PostgreSQL connected → ${db.database} @ ${db.host}:${db.port}`,
    )
  } finally {
    client.release()
  }
}

const query = (text, params) => pool.query(text, params)

export { pool, connectDB, query }
