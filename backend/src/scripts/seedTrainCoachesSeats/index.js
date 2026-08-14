import 'dotenv/config'
import { pool } from "../../config/db.js"
import { seedMasters, generateInventory } from "./seed.js"
import { printSummary } from "./printSummary.js"
async function main() {
  const onlyTrain = process.argv.find((a) => a.startsWith('--train='))?.split('=')[1] || null
  const limit = Number(
    process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || 0,
  )
  const reset = process.argv.includes('--reset')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    console.log('Seeding class master + default template...')
    await seedMasters(client)
    await generateInventory(client, { reset, limit, onlyTrain })
    await client.query('COMMIT')
    await printSummary(client)
    console.log('Done.')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
