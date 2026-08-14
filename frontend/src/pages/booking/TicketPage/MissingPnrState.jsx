import { useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import Button from '../../../components/ui/Button'

export default function MissingPnrState() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-dvh items-center justify-center bg-sky-mist p-4 sm:p-6">
      <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-line bg-white p-6 text-center shadow-card sm:p-8">
        <TrachNexaLogo className="h-16 w-16 text-primary-deep" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-charcoal sm:text-3xl">
          No PNR found
        </h1>
        <p className="mt-2 text-sm text-slate">
          Complete a booking first, then open your e-ticket from the confirmation screen.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate('/home')}>
          Back to home
        </Button>
      </div>
    </main>
  )
}
