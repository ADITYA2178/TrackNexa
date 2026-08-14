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

export { printSummary }