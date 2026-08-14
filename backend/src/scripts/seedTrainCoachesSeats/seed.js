import { CLASS_DEFS, DEFAULT_TEMPLATE } from "./data.js"
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

export { seedMasters, generateInventory }