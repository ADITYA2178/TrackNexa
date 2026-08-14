import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import Button from '../../../components/ui/Button'
import { formatStationName, formatTime } from '../../../utils/format'

export function TrainHoldSummary({
  train,
  journeyDate,
  sourceStation,
  destinationStation,
  summaryBits,
  seatCount,
}) {
  return (
    <section className="bg-charcoal text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-aqua-gradient px-3 py-1 text-[10px] font-black uppercase tracking-widest text-charcoal">
                Train {train.trainNo}
              </span>
              <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
                {summaryBits.classCode} · {seatCount} seat{seatCount === 1 ? '' : 's'}
              </span>
            </div>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">
              {formatStationName(train.trainName)}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {sourceStation} → {destinationStation} · {journeyDate}
              {summaryBits.preferredCoach ? ` · Preferred ${summaryBits.preferredCoach}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Depart
              </span>
              <span className="font-extrabold">{formatTime(train.from?.departureTime)}</span>
            </div>
            <span className="h-px w-8 bg-secondary/60" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Arrive
              </span>
              <span className="font-extrabold">{formatTime(train.to?.arrivalTime)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function HoldPageHeader({ onBack }) {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-soft text-charcoal">
            ←
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
              Back to seats
            </span>
            <span className="truncate font-heading text-base font-bold text-charcoal sm:text-lg">
              Passenger details
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
  )
}

export function HoldSidebar({ summaryBits, seatCount, onHold, isPending }) {
  return (
    <aside className="hidden w-full flex-col lg:flex lg:w-[320px] lg:shrink-0 lg:self-start">
      <div className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
        <div className="bg-charcoal p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
            Ready to hold
          </p>
          <h2 className="mt-1 font-heading text-2xl font-bold">Seat hold</h2>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate">Class</span>
            <span className="font-extrabold">{summaryBits.classCode}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate">Passengers</span>
            <span className="font-extrabold">{seatCount}</span>
          </div>
          {summaryBits.preferredCoach ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate">Preferred coach</span>
              <span className="font-extrabold">{summaryBits.preferredCoach}</span>
            </div>
          ) : null}
          <p className="rounded-2xl bg-sky-mist px-3 py-3 text-xs leading-relaxed text-slate">
            Holding locks seats for about 10 minutes. Fare is calculated when the hold is created.
          </p>
          <Button
            className="w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onHold}
            disabled={isPending}
          >
            {isPending ? 'Holding seats…' : 'Hold seats'}
          </Button>
        </div>
      </div>
    </aside>
  )
}

export function MobileHoldBar({
  summaryBits,
  seatCount,
  sourceStation,
  destinationStation,
  onHold,
  isPending,
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold uppercase tracking-wider text-primary-deep">
            {summaryBits.classCode} · {seatCount} passenger{seatCount === 1 ? '' : 's'}
          </p>
          <p className="truncate text-sm font-semibold text-slate">
            {sourceStation} → {destinationStation}
          </p>
        </div>
        <Button
          className="shrink-0 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onHold}
          disabled={isPending}
        >
          {isPending ? 'Holding…' : 'Hold seats'}
        </Button>
      </div>
    </div>
  )
}
