import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import { getStoredActiveHold, getStoredAuthUser } from '../../../api/bookings'
import {
  createPaymentOrder,
  getStoredPendingPayment,
  storePendingPayment,
} from '../../../api/payments'
import useHoldCountdown from '../../../hooks/useHoldCountdown'
import MissingHoldState from './MissingHoldState'
import OrderCreatedView from './OrderCreatedView'

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
      toast.success(
        data?.message ?? (data?.reused ? 'Existing order loaded' : 'Payment order created'),
      )
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
    return <MissingHoldState onBackHome={() => navigate('/home')} />
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
              countdown?.expired ? 'bg-[#E07A7A] text-white' : 'bg-aqua-gradient text-charcoal'
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

      <OrderCreatedView
        hold={hold}
        paymentOrder={paymentOrder}
        countdown={countdown}
        amount={amount}
        isCreating={isCreating}
        createFailed={createFailed}
        orderError={orderMutation.error?.message}
        orderPending={orderMutation.isPending}
        onRetry={retryCreateOrder}
        onProceed={() =>
          navigate('/booking/verify', {
            state: { hold, payment: paymentOrder },
          })
        }
        onConfirmWithoutPayment={() => navigate('/booking/confirm', { state: { hold } })}
      />
    </main>
  )
}
