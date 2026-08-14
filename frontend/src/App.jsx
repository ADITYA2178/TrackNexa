import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
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
