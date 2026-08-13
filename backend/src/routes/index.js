const { Router } = require('express')
const signUpController = require('../controllers/signUp.controller')
const loginController = require('../controllers/login.controller')
const stationController = require('../controllers/station.controller')
const trainRouteController = require('../controllers/trainRoute.controller')
const seatAvailabilityController = require('../controllers/seatAvailability.controller')
const bookingController = require('../controllers/booking.controller')
const paymentController = require('../controllers/payment.controller')
const ticketController = require('../controllers/ticket.controller')

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

router.post('/api/sign-up', signUpController.signUp)
router.post('/api/login', loginController.login)

router.get('/api/stations', stationController.listStations)
router.get('/api/stations/:code', stationController.getStation)

router.post('/api/trains/search', trainRouteController.searchTrains)
router.post('/api/trains/route', trainRouteController.getTrainRoute)
router.post('/api/trains/availability', seatAvailabilityController.getAvailability)
router.post('/api/bookings/hold', bookingController.createHold)
router.post('/api/bookings/confirm', bookingController.confirmHold)
router.post('/api/bookings/cancel', bookingController.cancelBooking)
router.get('/api/bookings/user/:userId', bookingController.getByUser)
router.get('/api/bookings/:pnr/ticket', bookingController.getTicket)
router.get('/api/bookings/:pnr', bookingController.getByPnr)

router.post('/api/payments/create-order', paymentController.createOrder)
router.post('/api/payments/verify', paymentController.verify)
router.post('/api/tickets/verify', ticketController.verify)

module.exports = router
