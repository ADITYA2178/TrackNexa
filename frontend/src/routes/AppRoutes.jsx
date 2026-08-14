import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'

const HomePage = lazy(() => import('../pages/home/HomePage'))
const LoginPage = lazy(() => import('../pages/login/LoginPage'))
const SignUpPage = lazy(() => import('../pages/signup/SignUpPage'))
const SeatSelectionPage = lazy(() => import('../pages/booking/SeatSelectionPage'))
const PassengerHoldPage = lazy(() => import('../pages/booking/PassengerHoldPage'))
const ConfirmHoldPage = lazy(() => import('../pages/booking/ConfirmHoldPage'))
const PaymentOrderPage = lazy(() => import('../pages/booking/PaymentOrderPage'))
const PaymentVerifyPage = lazy(() => import('../pages/booking/PaymentVerifyPage'))
const TicketPage = lazy(() => import('../pages/booking/TicketPage'))
const BookingDetailsPage = lazy(() => import('../pages/booking/BookingDetailsPage'))
const CancelBookingPage = lazy(() => import('../pages/booking/CancelBookingPage'))
const MyBookingsPage = lazy(() => import('../pages/booking/MyBookingsPage'))
const TicketVerifyPage = lazy(() => import('../pages/booking/TicketVerifyPage'))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist text-sm font-semibold text-slate">
      Loading…
    </div>
  )
}

function Guard({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/home" element={<Guard><HomePage /></Guard>} />
        <Route path="/trains/:trainNo/seats" element={<Guard><SeatSelectionPage /></Guard>} />
        <Route path="/booking/hold" element={<Guard><PassengerHoldPage /></Guard>} />
        <Route path="/booking/confirm" element={<Guard><ConfirmHoldPage /></Guard>} />
        <Route path="/booking/payment" element={<Guard><PaymentOrderPage /></Guard>} />
        <Route path="/booking/verify" element={<Guard><PaymentVerifyPage /></Guard>} />
        <Route path="/booking/ticket/:pnr" element={<Guard><TicketPage /></Guard>} />
        <Route path="/booking/ticket" element={<Guard><TicketPage /></Guard>} />
        <Route path="/booking/pnr/:pnr" element={<Guard><BookingDetailsPage /></Guard>} />
        <Route path="/booking/pnr" element={<Guard><BookingDetailsPage /></Guard>} />
        <Route path="/booking/cancel/:pnr" element={<Guard><CancelBookingPage /></Guard>} />
        <Route path="/booking/my" element={<Guard><MyBookingsPage /></Guard>} />
        <Route path="/booking/verify-ticket" element={<Guard><TicketVerifyPage /></Guard>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}
