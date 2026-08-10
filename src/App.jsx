import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SignUp from './components/SignUp'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SignUp />
    </QueryClientProvider>
  )
}

export default App
