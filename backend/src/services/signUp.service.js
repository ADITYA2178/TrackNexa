import * as signUpModel from "../models/signUp.model.js"
import {
  encryptPassword,
  validatePasswordStrength,
} from "../utils/password.js"
async function registerUser({
  fullName,
  email,
  mobileNumber,
  password,
  confirmPassword,
}) {
  if (!fullName || !email || !mobileNumber || !password || !confirmPassword) {
    const error = new Error('All fields are required')
    error.status = 400
    throw error
  }

  if (password !== confirmPassword) {
    const error = new Error('Passwords do not match')
    error.status = 400
    throw error
  }

  const strength = validatePasswordStrength(password)
  if (!strength.valid) {
    const error = new Error(strength.errors.join('. '))
    error.status = 400
    error.errors = strength.errors
    throw error
  }

  const existing = await signUpModel.findByEmail(email.toLowerCase().trim())
  if (existing) {
    const error = new Error('Email already registered')
    error.status = 409
    throw error
  }

  const passwordHash = encryptPassword(password)

  const user = await signUpModel.createSignUp({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    mobileNumber: mobileNumber.trim(),
    passwordHash,
  })

  return user
}

export { registerUser }