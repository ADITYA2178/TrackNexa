import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
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
            path="/signup"
            element={<SignUpPage />}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              border: '1px solid #E9DFC0',
              color: '#073936',
              fontWeight: 600,
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
