import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import PassengerHoldPage from './pages/booking/PassengerHoldPage'
import PaymentOrderPage from './pages/booking/PaymentOrderPage'
import PaymentVerifyPage from './pages/booking/PaymentVerifyPage'
import SeatSelectionPage from './pages/booking/SeatSelectionPage'
import HomePage from './pages/home/HomePage'
import LoginPage from './pages/login/LoginPage'
import SignUpPage from './pages/signup/SignUpPage'

const queryClient = new QueryClient()

function ProtectedRoute({ children }) {
  const authToken = localStorage.getItem('authToken')

  if (!authToken) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={<LoginPage />}
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trains/:trainNo/seats"
            element={
              <ProtectedRoute>
                <SeatSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/hold"
            element={
              <ProtectedRoute>
                <PassengerHoldPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/payment"
            element={
              <ProtectedRoute>
                <PaymentOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/verify"
            element={
              <ProtectedRoute>
                <PaymentVerifyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/signup"
            element={<SignUpPage />}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster
          position="top-center"
          containerStyle={{
            top: 12,
            left: 12,
            right: 12,
          }}
          toastOptions={{
            duration: 3500,
            style: {
              border: '2px solid #5A8FA8',
              color: '#042A3A',
              fontWeight: 600,
              maxWidth: 'min(420px, calc(100vw - 1.5rem))',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
