import { query } from "../config/db.js"
async function createSignUp({ fullName, email, mobileNumber, passwordHash }) {
  const result = await query(
    `INSERT INTO sign_up (full_name, email, mobile_number, password)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, mobile_number, created_at`,
    [fullName, email, mobileNumber, passwordHash],
  )

  return result.rows[0]
}

async function findByEmail(email) {
  const result = await query(
    `SELECT id, full_name, email, mobile_number, created_at
     FROM sign_up
     WHERE email = $1`,
    [email],
  )

  return result.rows[0] || null
}

async function findByEmailWithPassword(email) {
  const result = await query(
    `SELECT id, full_name, email, mobile_number, password, created_at
     FROM sign_up
     WHERE email = $1`,
    [email],
  )

  return result.rows[0] || null
}

async function findByMobileWithPassword(mobileNumber) {
  const result = await query(
    `SELECT id, full_name, email, mobile_number, password, created_at
     FROM sign_up
     WHERE mobile_number = $1`,
    [mobileNumber],
  )

  return result.rows[0] || null
}

export { createSignUp, findByEmail, findByEmailWithPassword, findByMobileWithPassword }