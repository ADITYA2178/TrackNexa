import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <h1 className="text-5xl font-bold">Hello World!</h1>
      </main>
    </QueryClientProvider>
  )
}

export default App
