import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import { getStoredActiveHold } from '../../api/bookings'
import {
  buildProviderSignature,
  clearPendingPayment,
  generateProviderTxnId,
  getStoredPendingPayment,
  hasPaymentHmacSecret,
  storeConfirmedBooking,
  verifyPayment,
} from '../../api/payments'
import Button from '../../components/ui/Button'

const PAY_METHODS = [
  { id: 'upi', label: 'UPI', hint: 'GPay · PhonePe · Paytm' },
  { id: 'card', label: 'Card', hint: 'Debit / Credit' },
  { id: 'netbanking', label: 'Net banking', hint: 'All major banks' },
]

function formatStationName(name = '') {
  return String(name || '')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export default function PaymentVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const hold = location.state?.hold ?? getStoredActiveHold()
  const payment =
    location.state?.payment ??
    (() => {
      const stored = getStoredPendingPayment()
      if (stored?.holdId && hold?.holdId && stored.holdId !== hold.holdId) return null
      return stored
    })()

  const [method, setMethod] = useState('upi')
  const [result, setResult] = useState(null)
  const hmacReady = hasPaymentHmacSecret()

  const amount = payment?.amount ?? hold?.fare?.totalFare

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!payment?.paymentId || !payment?.orderId) {
        throw new Error('Missing payment order. Go back and create one first.')
      }

      const providerTxnId = generateProviderTxnId()
      const providerSignature = await buildProviderSignature({
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        providerTxnId,
      })

      return verifyPayment({
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        providerTxnId,
        providerSignature,
      })
    },
    onSuccess: (data) => {
      storeConfirmedBooking(data)
      clearPendingPayment()
      setResult(data)
      toast.success(data?.message ?? 'Payment verified')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const sourceLabel =
    hold?.sourceStation?.code ?? hold?.sourceStation?.name ?? hold?.sourceStation
  const destLabel =
    hold?.destinationStation?.code ??
    hold?.destinationStation?.name ??
    hold?.destinationStation

  const pnr = result?.booking?.pnr ?? result?.ticket?.pnr
  const ticketPassengers = useMemo(
    () => result?.ticket?.passengers ?? result?.booking?.passengers ?? hold?.passengers ?? [],
    [result, hold],
  )

  if (!payment?.paymentId || !payment?.orderId) {
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
          <Button className="mt-6 w-full" onClick={() => navigate('/booking/payment')}>
            Go to payment order
          </Button>
        </div>
      </main>
    )
  }

  if (result) {
    return (
      <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
        <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                Booking confirmed
              </span>
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                Payment successful
              </span>
            </div>
            <TrachNexaLogo className="h-9 w-9 shrink-0 text-primary-deep sm:h-10 sm:w-10" />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
          <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
            <div className="bg-charcoal px-5 py-6 text-white sm:px-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                Your PNR
              </p>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-wide sm:text-4xl">
                {pnr || '—'}
              </h1>
              <p className="mt-3 text-sm text-white/75">
                {result.message}
                {result.idempotent ? ' (already verified)' : ''}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b-2 border-line p-4 sm:grid-cols-4 sm:p-5">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Status
                </span>
                <span className="mt-1 text-sm font-extrabold">
                  {result.booking?.status ?? result.ticket?.status ?? 'CONFIRMED'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Paid
                </span>
                <span className="mt-1 text-sm font-extrabold">
                  {formatMoney(result.payment?.amount ?? amount)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Train
                </span>
                <span className="mt-1 text-sm font-extrabold">
                  {result.ticket?.trainId ?? hold?.trainId ?? '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Class
                </span>
                <span className="mt-1 text-sm font-extrabold">
                  {result.ticket?.classCode ?? hold?.classCode ?? '—'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-deep">
                Passengers
              </p>
              {ticketPassengers.map((passenger, index) => (
                <div
                  key={`${passenger.seq ?? index}-${passenger.fullName}`}
                  className="flex flex-col gap-2 rounded-2xl border-2 border-line bg-sky-mist px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-charcoal">
                      {passenger.seq ?? index + 1}. {formatStationName(passenger.fullName)}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate">
                      {passenger.age ? `Age ${passenger.age}` : null}
                      {passenger.gender ? ` · ${passenger.gender}` : null}
                    </p>
                  </div>
                  {(passenger.allocation || passenger.coachNumber) && (
                    <span className="shrink-0 rounded-full bg-charcoal px-3 py-1.5 text-xs font-extrabold text-white">
                      {passenger.allocation?.coachNumber ?? passenger.coachNumber}-
                      {passenger.allocation?.seatNumber ?? passenger.seatNumber}
                      {' · '}
                      {passenger.allocation?.berthType ?? passenger.berthType ?? 'SEAT'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="w-full py-3.5 sm:flex-1"
              onClick={() => toast('Ticket view comes next — API #5')}
            >
              View ticket
            </Button>
            <Button
              variant="ghost"
              className="w-full border-2 border-line py-3.5 sm:flex-1"
              onClick={() => navigate('/home')}
            >
              Back to home
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/booking/payment', { state: { hold } })}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-soft text-charcoal">
              ←
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                Back to order
              </span>
              <span className="truncate font-heading text-base font-bold text-charcoal sm:text-lg">
                Complete payment
              </span>
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <TrachNexaLogo className="h-9 w-9 text-primary-deep sm:h-10 sm:w-10" />
            <span className="hidden text-xs font-extrabold uppercase tracking-[0.2em] text-charcoal sm:block">
              Track Nexa
            </span>
          </div>
        </div>
      </header>

      <section className="bg-charcoal text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
            Step 5 · Verify payment
          </p>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl md:text-4xl">
            Pay {formatMoney(amount)}
          </h1>
          <p className="text-sm text-white/70">
            {hold
              ? `Train ${hold.trainId} · ${hold.classCode} · ${sourceLabel} → ${destLabel}`
              : `Order ${payment.orderId}`}
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 pb-28 sm:px-6 lg:flex-row lg:pb-8 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {!hmacReady ? (
            <div className="rounded-3xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-5 sm:px-5">
              <p className="font-heading text-lg font-bold text-charcoal">Demo secret missing</p>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                Add <span className="font-semibold text-charcoal">VITE_PAYMENT_HMAC_SECRET</span> to{' '}
                <span className="font-semibold text-charcoal">frontend/.env</span> using the same
                value as backend <span className="font-semibold text-charcoal">PAYMENT_HMAC_SECRET</span>{' '}
                or <span className="font-semibold text-charcoal">AES_SECRET_KEY</span>, then restart
                the Vite dev server.
              </p>
            </div>
          ) : null}

          <section className="rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-deep">
              Payment method
            </p>
            <h2 className="mt-1 font-heading text-xl font-bold sm:text-2xl">
              Choose how to pay
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PAY_METHODS.map((item) => {
                const active = method === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    className={`flex flex-col rounded-2xl border-2 p-4 text-left transition ${
                      active
                        ? 'border-charcoal bg-charcoal text-white shadow-card'
                        : 'border-line bg-white hover:border-primary-deep'
                    }`}
                  >
                    <span className={`text-sm font-extrabold ${active ? 'text-secondary' : 'text-charcoal'}`}>
                      {item.label}
                    </span>
                    <span className={`mt-1 text-xs font-semibold ${active ? 'text-white/65' : 'text-slate'}`}>
                      {item.hint}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-4 rounded-2xl bg-sky-mist px-3 py-3 text-xs leading-relaxed text-slate">
              Demo INTERNAL provider: paying generates a txn id, signs it, and calls{' '}
              <span className="font-semibold text-charcoal">/api/payments/verify</span>. A valid
              signature confirms the booking and issues a PNR.
            </p>
          </section>

          <section className="rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-deep">
              Order snapshot
            </p>
            <div className="mt-3 flex flex-col">
              <div className="flex justify-between gap-3 border-b border-line/60 py-3 text-sm">
                <span className="text-slate">Payment ID</span>
                <span className="break-all text-right font-mono text-xs font-bold sm:text-sm">
                  {payment.paymentId}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-b border-line/60 py-3 text-sm">
                <span className="text-slate">Order ID</span>
                <span className="break-all text-right font-mono text-xs font-bold sm:text-sm">
                  {payment.orderId}
                </span>
              </div>
              <div className="flex justify-between gap-3 py-3 text-sm">
                <span className="text-slate">Hold ID</span>
                <span className="break-all text-right font-mono text-xs font-bold sm:text-sm">
                  {payment.holdId}
                </span>
              </div>
            </div>
          </section>
        </div>

        <aside className="hidden w-full flex-col lg:flex lg:w-[320px] lg:shrink-0 lg:self-start">
          <div className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
            <div className="bg-charcoal p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                Amount due
              </p>
              <h2 className="mt-1 font-heading text-3xl font-bold">{formatMoney(amount)}</h2>
              <p className="mt-2 text-xs text-white/65">
                Via {PAY_METHODS.find((item) => item.id === method)?.label}
              </p>
            </div>
            <div className="flex flex-col gap-3 p-5">
              <Button
                className="w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!hmacReady || verifyMutation.isPending}
                onClick={() => verifyMutation.mutate()}
              >
                {verifyMutation.isPending ? 'Verifying…' : `Pay ${formatMoney(amount)}`}
              </Button>
              <p className="text-center text-[10px] leading-relaxed text-slate">
                On success, seats confirm and a PNR is issued immediately.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">
              {PAY_METHODS.find((item) => item.id === method)?.label}
            </p>
            <p className="text-xl font-black text-charcoal">{formatMoney(amount)}</p>
          </div>
          <Button
            className="shrink-0 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hmacReady || verifyMutation.isPending}
            onClick={() => verifyMutation.mutate()}
          >
            {verifyMutation.isPending ? 'Verifying…' : 'Pay now'}
          </Button>
        </div>
      </div>
    </main>
  )
}
