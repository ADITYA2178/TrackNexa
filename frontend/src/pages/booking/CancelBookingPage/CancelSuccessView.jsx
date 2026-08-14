import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import Button from '../../../components/ui/Button'
import { formatDateTime, formatMoney, formatStationName } from '../../../utils/format'

export default function CancelSuccessView({ cancelResult, onViewStatus, onHome }) {
  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
              Cancellation complete
            </span>
            <span className="truncate font-heading text-base font-bold sm:text-lg">
              Booking cancelled
            </span>
          </div>
          <TrachNexaLogo className="h-9 w-9 shrink-0 text-primary-deep sm:h-10 sm:w-10" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
          <div className="bg-[#6B2B2B] px-5 py-6 text-white sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F3B4B4]">
              PNR cancelled
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-wide sm:text-4xl">
              {cancelResult.pnr}
            </h1>
            <p className="mt-3 text-sm text-white/75">{cancelResult.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b-2 border-line p-4 sm:grid-cols-4 sm:p-5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                Status
              </span>
              <span className="mt-1 text-sm font-extrabold">{cancelResult.status}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                Cancelled at
              </span>
              <span className="mt-1 text-sm font-extrabold">
                {formatDateTime(cancelResult.cancelledAt) ?? '—'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                Total fare
              </span>
              <span className="mt-1 text-sm font-extrabold">
                {formatMoney(cancelResult.totalFare)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                Refund
              </span>
              <span className="mt-1 text-sm font-extrabold text-primary-deep">
                {formatMoney(cancelResult.refund?.amount ?? cancelResult.refundAmount)}
                {cancelResult.refund?.percent != null
                  ? ` (${cancelResult.refund.percent}%)`
                  : ''}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-deep">
              Released seats
            </p>
            {(cancelResult.cancelledPassengers ?? []).map((passenger) => (
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
                  {passenger.releasedSeat?.coachNumber}-{passenger.releasedSeat?.seatNumber}
                  {' · '}
                  {passenger.releasedSeat?.berthType || 'SEAT'}
                </span>
              </div>
            ))}
            {cancelResult.cancellationReason ? (
              <p className="rounded-2xl bg-sky-mist px-4 py-3 text-sm text-slate">
                Reason:{' '}
                <span className="font-semibold text-charcoal">
                  {cancelResult.cancellationReason}
                </span>
              </p>
            ) : null}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="w-full py-3.5 sm:flex-1" onClick={onViewStatus}>
            View booking status
          </Button>
          <Button
            variant="ghost"
            className="w-full border-2 border-line py-3.5 sm:flex-1"
            onClick={onHome}
          >
            Back to home
          </Button>
        </div>
      </div>
    </main>
  )
}
