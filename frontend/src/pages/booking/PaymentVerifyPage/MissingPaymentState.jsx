import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import Button from '../../../components/ui/Button'

export default function MissingPaymentState({ onGoToOrder }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-sky-mist p-4 sm:p-6">
      <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-line bg-white p-6 text-center shadow-card sm:p-8">
        <TrachNexaLogo className="h-16 w-16 text-primary-deep" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-charcoal sm:text-3xl">
          No payment order
        </h1>
        <p className="mt-2 text-sm text-slate">
          Create a payment order from your seat hold before verifying payment.
        </p>
        <Button className="mt-6 w-full" onClick={onGoToOrder}>
          Go to payment order
        </Button>
      </div>
    </main>
  )
}
