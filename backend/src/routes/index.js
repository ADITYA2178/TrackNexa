const { Router } = require('express')
const signUpController = require('../controllers/signUp.controller')
const loginController = require('../controllers/login.controller')
const stationController = require('../controllers/station.controller')

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

router.post('/api/sign-up', signUpController.signUp)
router.post('/api/login', loginController.login)

router.get('/api/stations', stationController.listStations)
router.get('/api/stations/:code', stationController.getStation)

module.exports = router
