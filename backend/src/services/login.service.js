import * as signUpModel from "../models/signUp.model.js"
import { verifyPassword } from "../utils/password.js"
function toPublicUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    mobile_number: user.mobile_number,
    created_at: user.created_at,
  }
}

async function loginUser({ email, mobileNumber, phone, password }) {
  const phoneNumber = mobileNumber || phone

  if (!password) {
    const error = new Error('Password is required')
    error.status = 400
    throw error
  }

  if (!email && !phoneNumber) {
    const error = new Error('Email or phone number is required')
    error.status = 400
    throw error
  }

  if (email && phoneNumber) {
    const error = new Error('Use either email or phone number, not both')
    error.status = 400
    throw error
  }

  let user = null

  if (email) {
    user = await signUpModel.findByEmailWithPassword(email.toLowerCase().trim())
  } else {
    user = await signUpModel.findByMobileWithPassword(phoneNumber.trim())
  }

  if (!user || !verifyPassword(password, user.password)) {
    const error = new Error('Invalid credentials')
    error.status = 401
    throw error
  }

  return toPublicUser(user)
}

export { loginUser }