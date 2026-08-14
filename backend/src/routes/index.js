import { Router } from "express"
import * as signUpController from "../controllers/signUp.controller.js"
import * as loginController from "../controllers/login.controller.js"
import * as stationController from "../controllers/station.controller.js"
import * as trainRouteController from "../controllers/trainRoute.controller.js"
import * as seatAvailabilityController from "../controllers/seatAvailability.controller.js"
import * as bookingController from "../controllers/booking.controller.js"
import * as paymentController from "../controllers/payment.controller.js"
import * as ticketController from "../controllers/ticket.controller.js"
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

export default router