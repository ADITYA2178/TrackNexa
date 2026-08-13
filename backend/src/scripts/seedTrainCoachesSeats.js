require('dotenv').config()

const { pool } = require('../config/db')

const CLASS_DEFS = [
  {
    class_code: '1A',
    class_name: 'First AC',
    capacity: 24,
    berth_cycle: ['LB', 'UB'],
    is_seating: false,
  },
  {
    class_code: '2A',
    class_name: 'AC 2 Tier',
    capacity: 52,
    berth_cycle: ['LB', 'UB', 'SL', 'SU'],
    is_seating: false,
  },
  {
    class_code: '3A',
    class_name: 'AC 3 Tier',
    capacity: 72,
    berth_cycle: ['LB', 'MB', 'UB', 'SL', 'SU'],
    is_seating: false,
  },
  {
    class_code: '3E',
    class_name: 'AC 3 Tier Economy',
    capacity: 83,
    berth_cycle: ['LB', 'MB', 'UB', 'SL', 'SU'],
    is_seating: false,
  },
  {
    class_code: 'SL',
    class_name: 'Sleeper',
    capacity: 80,
    berth_cycle: ['LB', 'MB', 'UB', 'SL', 'SU'],
    is_seating: false,
  },
  {
    class_code: 'CC',
    class_name: 'AC Chair Car',
    capacity: 78,
    berth_cycle: ['WS', 'AS'],
    is_seating: true,
  },
  {
    class_code: 'EC',
    class_name: 'Executive Chair Car',
    capacity: 56,
    berth_cycle: ['SEAT'],
    is_seating: true,
  },
  {
    class_code: '2S',
    class_name: 'Second Sitting',
    capacity: 108,
    berth_cycle: ['SEAT'],
    is_seating: true,
  },
]

const DEFAULT_TEMPLATE = [
  { position_seq: 1, coach_number: 'H1', class_code: '1A' },
  { position_seq: 2, coach_number: 'A1', class_code: '2A' },
  { position_seq: 3, coach_number: 'A2', class_code: '2A' },
  { position_seq: 4, coach_number: 'B1', class_code: '3A' },
  { position_seq: 5, coach_number: 'B2', class_code: '3A' },
  { position_seq: 6, coach_number: 'B3', class_code: '3A' },
  { position_seq: 7, coach_number: 'M1', class_code: '3E' },
  { position_seq: 8, coach_number: 'S1', class_code: 'SL' },
  { position_seq: 9, coach_number: 'S2', class_code: 'SL' },
  { position_seq: 10, coach_number: 'S3', class_code: 'SL' },
  { position_seq: 11, coach_number: 'S4', class_code: 'SL' },
  { position_seq: 12, coach_number: 'C1', class_code: 'CC' },
  { position_seq: 13, coach_number: 'E1', class_code: 'EC' },
  { position_seq: 14, coach_number: 'D1', class_code: '2S' },
  { position_seq: 15, coach_number: 'D2', class_code: '2S' },
]

async function seedMasters(client) {
  for (const cls of CLASS_DEFS) {
    await client.query(
      `
      INSERT INTO coach_class_master
        (class_code, class_name, capacity, berth_cycle, is_seating)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (class_code) DO UPDATE
      SET class_name = EXCLUDED.class_name,
          capacity = EXCLUDED.capacity,
          berth_cycle = EXCLUDED.berth_cycle,
          is_seating = EXCLUDED.is_seating
      `,
      [
        cls.class_code,
        cls.class_name,
        cls.capacity,
        cls.berth_cycle,
        cls.is_seating,
      ],
    )
  }

  await client.query('DELETE FROM default_coach_template')
  for (const row of DEFAULT_TEMPLATE) {
    await client.query(
      `
      INSERT INTO default_coach_template (position_seq, coach_number, class_code, is_active)
      VALUES ($1, $2, $3, TRUE)
      `,
      [row.position_seq, row.coach_number, row.class_code],
    )
  }
}

async function generateInventory(client, { reset = false, limit = 0, onlyTrain = null } = {}) {
  if (reset) {
    console.log('Clearing existing seats/coaches...')
    await client.query('TRUNCATE train_seats RESTART IDENTITY CASCADE')
    await client.query('TRUNCATE train_coaches RESTART IDENTITY CASCADE')
  }

  await client.query("SET LOCAL statement_timeout = '0'")
  await client.query("SET LOCAL work_mem = '256MB'")

  console.log('Creating train_coaches from default template...')
  const coachResult = await client.query(
    `
    INSERT INTO train_coaches (train_no, coach_number, class_code, position_seq)
    SELECT t.train_no, d.coach_number, d.class_code, d.position_seq
    FROM (
      SELECT train_no
      FROM (
        SELECT DISTINCT train_no
        FROM train_routes
        WHERE train_no IS NOT NULL
          AND TRIM(train_no) <> ''
          AND ($1::text IS NULL OR train_no = $1)
      ) distinct_trains
      ORDER BY train_no
      LIMIT COALESCE(NULLIF($2::int, 0), 2147483647)
    ) t
    CROSS JOIN default_coach_template d
    WHERE d.is_active = TRUE
    ON CONFLICT (train_no, coach_number) DO UPDATE
    SET class_code = EXCLUDED.class_code,
        position_seq = EXCLUDED.position_seq,
        is_active = TRUE
    `,
    [onlyTrain, limit || 0],
  )
  console.log(`  coaches upserted: ${coachResult.rowCount}`)

  console.log('Generating train_seats (bulk)...')
  const seatResult = await client.query(
    `
    INSERT INTO train_seats (train_coach_id, seat_number, berth_type, seat_seq, is_bookable)
    SELECT
      tc.id,
      gs::text AS seat_number,
      ccm.berth_cycle[((gs - 1) % cardinality(ccm.berth_cycle)) + 1] AS berth_type,
      gs AS seat_seq,
      TRUE
    FROM train_coaches tc
    JOIN coach_class_master ccm ON ccm.class_code = tc.class_code
    CROSS JOIN LATERAL generate_series(1, ccm.capacity) AS gs
    WHERE NOT EXISTS (
      SELECT 1 FROM train_seats ts WHERE ts.train_coach_id = tc.id
    )
      AND ($1::text IS NULL OR tc.train_no = $1)
    `,
    [onlyTrain],
  )
  console.log(`  seats inserted: ${seatResult.rowCount}`)
}

async function printSummary(client) {
  const classes = await client.query(
    `SELECT class_code, class_name, capacity FROM coach_class_master ORDER BY class_code`,
  )
  const template = await client.query(
    `
    SELECT position_seq, coach_number, class_code
    FROM default_coach_template
    ORDER BY position_seq
    `,
  )
  const totals = await client.query(
    `
    SELECT
      (SELECT COUNT(DISTINCT train_no)::int FROM train_coaches) AS trains,
      (SELECT COUNT(*)::int FROM train_coaches) AS coaches,
      (SELECT COUNT(*)::int FROM train_seats) AS seats
    `,
  )
  const sampleTrain = await client.query(
    `SELECT train_no FROM train_coaches ORDER BY train_no LIMIT 1`,
  )
  const trainNo = sampleTrain.rows[0]?.train_no
  const sampleRake = trainNo
    ? await client.query(
        `
        SELECT tc.coach_number, tc.class_code, COUNT(ts.id)::int AS seats
        FROM train_coaches tc
        LEFT JOIN train_seats ts ON ts.train_coach_id = tc.id
        WHERE tc.train_no = $1
        GROUP BY tc.coach_number, tc.class_code, tc.position_seq
        ORDER BY tc.position_seq
        `,
        [trainNo],
      )
    : { rows: [] }
  const sampleSeats = trainNo
    ? await client.query(
        `
        SELECT tc.coach_number, ts.seat_number, ts.berth_type, ts.seat_seq
        FROM train_seats ts
        JOIN train_coaches tc ON tc.id = ts.train_coach_id
        WHERE tc.train_no = $1 AND tc.coach_number = 'B1'
        ORDER BY ts.seat_seq
        LIMIT 8
        `,
        [trainNo],
      )
    : { rows: [] }

  console.log('\nClasses:', classes.rows)
  console.log('Default template:', template.rows)
  console.log('Totals:', totals.rows[0])
  console.log(`Sample rake (${trainNo}):`, sampleRake.rows)
  console.log('Sample B1 seats:', sampleSeats.rows)
}

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
