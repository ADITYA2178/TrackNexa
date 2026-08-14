import DetailRow from '../../../components/booking/DetailRow'
import Button from '../../../components/ui/Button'
import { formatDateTime, formatMoney, formatStationName } from '../../../utils/format'
import OrderCreatingView from './OrderCreatingView'

export default function OrderCreatedView({
  hold,
  paymentOrder,
  countdown,
  amount,
  isCreating,
  createFailed,
  orderError,
  orderPending,
  onRetry,
  onProceed,
  onConfirmWithoutPayment,
}) {
  const passengerCount = hold.fare?.passengerCount ?? hold.passengers?.length ?? 0

  return (
    <>
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
                {paymentOrder?.status ??
                  (isCreating ? 'Creating…' : createFailed ? 'Failed' : 'Waiting')}
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {isCreating || createFailed ? (
                <OrderCreatingView
                  isCreating={isCreating}
                  createFailed={createFailed}
                  errorMessage={orderError}
                  retrying={orderPending}
                  onRetry={onRetry}
                />
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
                Server fare · {passengerCount} passenger{passengerCount === 1 ? '' : 's'}
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
                onClick={onProceed}
              >
                Proceed to pay
              </Button>
              <Button
                variant="ghost"
                className="w-full border-2 border-line py-3"
                onClick={onRetry}
                disabled={orderPending || countdown?.expired}
              >
                {orderPending ? 'Refreshing…' : 'Refresh order'}
              </Button>
              <button
                type="button"
                className="text-center text-[11px] font-semibold text-primary-deep underline-offset-2 hover:underline"
                onClick={onConfirmWithoutPayment}
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
            onClick={onProceed}
          >
            Proceed to pay
          </Button>
        </div>
      </div>
    </>
  )
}
