import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import { getStoredActiveHold, getStoredAuthUser } from '../../api/bookings'
import {
  createPaymentOrder,
  getStoredPendingPayment,
  storePendingPayment,
} from '../../api/payments'
import Button from '../../components/ui/Button'

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

function formatDateTime(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function useHoldCountdown(heldUntil) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!heldUntil) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [heldUntil])

  return useMemo(() => {
    if (!heldUntil) return null
    const end = new Date(heldUntil).getTime()
    if (Number.isNaN(end)) return null
    const remainingMs = Math.max(0, end - now)
    const totalSeconds = Math.floor(remainingMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return {
      expired: remainingMs <= 0,
      label: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      remainingMs,
    }
  }, [heldUntil, now])
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-3 last:border-b-0">
      <span className="shrink-0 text-sm text-slate">{label}</span>
      <span
        className={`min-w-0 text-right text-sm font-extrabold text-charcoal ${
          mono ? 'break-all font-mono text-xs sm:text-sm' : ''
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export default function PaymentOrderPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const hold = location.state?.hold ?? getStoredActiveHold()
  const authUser = getStoredAuthUser()
  const [paymentOrder, setPaymentOrder] = useState(() => {
    const stored = getStoredPendingPayment()
    if (stored?.holdId && hold?.holdId && stored.holdId !== hold.holdId) return null
    return stored
  })

  const countdown = useHoldCountdown(hold?.heldUntil)

  const orderMutation = useMutation({
    mutationFn: createPaymentOrder,
    onSuccess: (data) => {
      storePendingPayment(data)
      setPaymentOrder(data)
      toast.success(data?.message ?? (data?.reused ? 'Existing order loaded' : 'Payment order created'))
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  useEffect(() => {
    if (!hold?.holdId) return
    if (paymentOrder?.holdId === hold.holdId && paymentOrder?.status === 'PENDING') return
    if (orderMutation.isPending || orderMutation.isError) return

    orderMutation.mutate({
      holdId: hold.holdId,
      userId: authUser?.id ?? null,
    })
    // Intentionally run once on mount / when hold id is ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hold?.holdId])

  const retryCreateOrder = () => {
    if (!hold?.holdId) return
    orderMutation.mutate({
      holdId: hold.holdId,
      userId: authUser?.id ?? null,
    })
  }

  if (!hold?.holdId) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-sky-mist p-4 sm:p-6">
        <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-line bg-white p-6 text-center shadow-card sm:p-8">
          <TrachNexaLogo className="h-16 w-16 text-primary-deep" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-charcoal sm:text-3xl">
            No active hold
          </h1>
          <p className="mt-2 text-sm text-slate">
            Hold seats first, then create a payment order to continue booking.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/home')}>
            Back to train search
          </Button>
        </div>
      </main>
    )
  }

  const sourceLabel =
    hold.sourceStation?.code ?? hold.sourceStation?.name ?? hold.sourceStation
  const destLabel =
    hold.destinationStation?.code ?? hold.destinationStation?.name ?? hold.destinationStation
  const amount = paymentOrder?.amount ?? hold.fare?.totalFare
  const isCreating = orderMutation.isPending && !paymentOrder
  const createFailed = orderMutation.isError && !paymentOrder

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/booking/hold')}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-soft text-charcoal">
              ←
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                Back to hold
              </span>
              <span className="truncate font-heading text-base font-bold text-charcoal sm:text-lg">
                Payment order
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
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-7 lg:px-8">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
              Step 4 · Pay to confirm
            </p>
            <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl md:text-4xl">
              Secure your seats
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Train {hold.trainId} · {hold.classCode} · {sourceLabel} → {destLabel}
              {hold.journeyDate ? ` · ${hold.journeyDate}` : ''}
            </p>
          </div>

          <div
            className={`rounded-2xl px-4 py-3 text-center ${
              countdown?.expired ? 'bg-[#E07A7A]/text-white' : 'bg-aqua-gradient text-charcoal'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]">
              {countdown?.expired ? 'Hold expired' : 'Hold expires in'}
            </p>
            <p className="mt-1 font-heading text-2xl font-black tabular-nums">
              {countdown?.label ?? '--:--'}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 pb-28 sm:px-6 lg:flex-row lg:pb-8 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line px-4 py-4 sm:px-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-deep">
                  Order status
                </p>
                <h2 className="font-heading text-xl font-bold sm:text-2xl">Payment order</h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  paymentOrder?.status === 'PENDING'
                    ? 'bg-sky-soft text-primary-deep'
                    : createFailed
                      ? 'bg-[#FFF0F0] text-[#8A3A3A]'
                      : 'bg-sky-mist text-slate'
                }`}
              >
                {paymentOrder?.status ?? (isCreating ? 'Creating…' : createFailed ? 'Failed' : 'Waiting')}
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {isCreating ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-sky-mist px-4 py-12 text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-deep border-t-transparent" />
                  <p className="mt-4 text-sm font-semibold text-slate">Creating payment order…</p>
                </div>
              ) : createFailed ? (
                <div className="rounded-2xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-8 text-center">
                  <p className="font-heading text-lg font-bold text-charcoal">Couldn’t create order</p>
                  <p className="mt-2 text-sm text-slate">{orderMutation.error?.message}</p>
                  <Button className="mt-5" onClick={retryCreateOrder} disabled={orderMutation.isPending}>
                    {orderMutation.isPending ? 'Retrying…' : 'Try again'}
                  </Button>
                </div>
              ) : paymentOrder ? (
                <div className="flex flex-col">
                  {paymentOrder.reused ? (
                    <p className="mb-3 rounded-2xl bg-sky-soft px-3 py-2 text-xs font-semibold text-primary-deep">
                      Reused your existing pending order for this hold.
                    </p>
                  ) : null}
                  <DetailRow label="Payment ID" value={paymentOrder.paymentId} mono />
                  <DetailRow label="Order ID" value={paymentOrder.orderId} mono />
                  <DetailRow label="Hold ID" value={paymentOrder.holdId} mono />
                  <DetailRow label="Booking ID" value={paymentOrder.bookingId} />
                  <DetailRow label="Currency" value={paymentOrder.currency || 'INR'} />
                  <DetailRow
                    label="Created"
                    value={formatDateTime(paymentOrder.createdAt) ?? '—'}
                  />
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-deep">
              Travelers
            </p>
            <h2 className="mt-1 font-heading text-xl font-bold sm:text-2xl">On this hold</h2>
            <div className="mt-4 flex flex-col gap-3">
              {(hold.passengers ?? []).map((passenger) => (
                <div
                  key={`${passenger.seq}-${passenger.fullName}`}
                  className="flex flex-col gap-2 rounded-2xl border-2 border-line bg-sky-mist px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {passenger.seq}. {formatStationName(passenger.fullName)}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate">
                      Age {passenger.age} · {passenger.gender}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-charcoal px-3 py-1.5 text-xs font-extrabold text-white">
                    {passenger.allocation?.coachNumber}-{passenger.allocation?.seatNumber}
                    {' · '}
                    {passenger.allocation?.berthType || 'SEAT'}
                  </span>
                </div>
              ))}
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
                Server fare · {hold.fare?.passengerCount ?? hold.passengers?.length ?? 0} passenger
                {(hold.fare?.passengerCount ?? hold.passengers?.length ?? 0) === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate">Per passenger</span>
                <span className="font-extrabold">{formatMoney(hold.fare?.perPassenger)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate">Distance</span>
                <span className="font-extrabold">{hold.fare?.distanceKm ?? '—'} km</span>
              </div>
              <div className="flex items-center justify-between border-t-2 border-line pt-3 text-sm">
                <span className="font-bold text-charcoal">Total</span>
                <span className="text-xl font-black">{formatMoney(amount)}</span>
              </div>

              <Button
                className="mt-2 w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!paymentOrder || countdown?.expired}
                onClick={() =>
                  navigate('/booking/verify', {
                    state: { hold, payment: paymentOrder },
                  })
                }
              >
                Proceed to pay
              </Button>
              <Button
                variant="ghost"
                className="w-full border-2 border-line py-3"
                onClick={retryCreateOrder}
                disabled={orderMutation.isPending || countdown?.expired}
              >
                {orderMutation.isPending ? 'Refreshing…' : 'Refresh order'}
              </Button>
              <button
                type="button"
                className="text-center text-[11px] font-semibold text-primary-deep underline-offset-2 hover:underline"
                onClick={() => navigate('/booking/confirm', { state: { hold } })}
              >
                Confirm hold without payment
              </button>
              <p className="text-center text-[10px] leading-relaxed text-slate">
                Creating an order does not confirm the booking. Verification happens after payment.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">
              {countdown?.expired ? 'Hold expired' : `Hold ${countdown?.label ?? ''}`}
            </p>
            <p className="text-xl font-black text-charcoal">{formatMoney(amount)}</p>
          </div>
          <Button
            className="shrink-0 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!paymentOrder || countdown?.expired}
            onClick={() =>
              navigate('/booking/verify', {
                state: { hold, payment: paymentOrder },
              })
            }
          >
            Proceed to pay
          </Button>
        </div>
      </div>
    </main>
  )
}
