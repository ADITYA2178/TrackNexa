import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const authToken = localStorage.getItem('authToken')

  if (!authToken) {
    return <Navigate to="/login" replace />
  }

  return children
}
