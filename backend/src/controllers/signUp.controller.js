const signUpService = require('../services/signUp.service')

async function signUp(req, res) {
  try {
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
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
      ...(err.errors ? { errors: err.errors } : {}),
    })
  }
}

module.exports = {
  signUp,
}
