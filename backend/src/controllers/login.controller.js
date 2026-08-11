const loginService = require('../services/login.service')

async function login(req, res) {
  try {
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
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({
      message: err.message || 'Something went wrong',
    })
  }
}

module.exports = {
  login,
}
