import * as loginService from '../services/login.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const login = asyncHandler(async (req, res) => {
  const { email, mobileNumber, phone, password } = req.body

  const user = await loginService.loginUser({
    email,
    mobileNumber,
    phone,
    password,
  })

  return res.status(200).json({
    message: 'Login successful',
    user,
  })
})

export { login }
