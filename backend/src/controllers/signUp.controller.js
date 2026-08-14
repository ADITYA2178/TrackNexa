import * as signUpService from '../services/signUp.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const signUp = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    mobileNumber,
    password,
    confirmPassword,
  } = req.body

  const user = await signUpService.registerUser({
    fullName,
    email,
    mobileNumber,
    password,
    confirmPassword,
  })

  return res.status(201).json({
    message: 'Account created successfully',
    user,
  })
})

export { signUp }
