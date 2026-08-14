import Button from '../../../components/ui/Button'
import { formatStationName, formatTime } from '../../../utils/format'

export function TrainSummary({ train, journeyDate, sourceStation, destinationStation }) {
  return (
    <section className="bg-charcoal text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex min-w-0 flex-col">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-aqua-gradient px-3 py-1 text-[10px] font-black uppercase tracking-widest text-charcoal">
                Train {train.trainNo}
              </span>
              <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
                {journeyDate}
              </span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              {formatStationName(train.trainName)}
            </h1>
          </div>

          <div className="flex w-full min-w-0 items-center gap-3 sm:gap-4 lg:max-w-xl lg:shrink-0">
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-xl font-black sm:text-2xl">{formatTime(train.from?.departureTime)}</p>
              <p className="mt-1 text-sm font-bold text-secondary">{sourceStation}</p>
              <p className="truncate text-xs text-white/60">{formatStationName(train.from?.name)}</p>
            </div>
            <div className="flex min-w-16 shrink-0 flex-col items-center sm:min-w-24">
              <span className="text-[11px] font-bold text-white/70 sm:text-xs">{train.duration}</span>
              <div className="my-2 flex w-full items-center">
                <span className="h-2 w-2 rounded-full border border-secondary" />
                <span className="h-px flex-1 bg-secondary" />
                <span className="h-2 w-2 rounded-full bg-secondary" />
              </div>
              <span className="text-[10px] font-semibold text-white/50">{train.distanceKm} km</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-end text-right">
              <p className="text-xl font-black sm:text-2xl">{formatTime(train.to?.arrivalTime)}</p>
              <p className="mt-1 text-sm font-bold text-secondary">{destinationStation}</p>
              <p className="truncate text-xs text-white/60">{formatStationName(train.to?.name)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function TripSummaryAside({
  selectedClass,
  selectedCoach,
  seatCount,
  setSeatCount,
  maxSeats,
  onContinue,
}) {
  return (
    <aside className="hidden w-full flex-col lg:flex lg:w-[320px] lg:shrink-0 lg:self-start">
      <div className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
        <div className="bg-charcoal p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
            Your journey capsule
          </p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-white">Trip summary</h2>
        </div>
        <div className="flex flex-col p-5">
          <div className="flex items-center justify-between border-b-2 border-line pb-4">
            <span className="text-sm text-slate">Class</span>
            <span className="text-sm font-extrabold text-charcoal">
              {selectedClass.code} · {selectedClass.name}
            </span>
          </div>

          <div className="border-b-2 border-line py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">
              Selected coach
            </p>
            {selectedCoach ? (
              <div className="mt-3 rounded-2xl bg-sky-soft px-4 py-3">
                <p className="text-lg font-extrabold text-charcoal">{selectedCoach.coachNumber}</p>
                <p className="mt-1 text-xs font-semibold text-slate">
                  {selectedCoach.availableSeats} seats available
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border-2 border-dashed border-line bg-sky-mist p-4 text-center">
                <p className="text-sm font-semibold text-slate">Pick a coach with free seats</p>
              </div>
            )}
          </div>

          <div className="py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">
              How many seats?
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                disabled={!selectedCoach || seatCount <= 1}
                onClick={() => setSeatCount((n) => Math.max(1, n - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-white text-lg font-bold disabled:opacity-40"
              >
                −
              </button>
              <span className="min-w-10 text-center text-2xl font-black text-charcoal">{seatCount}</span>
              <button
                type="button"
                disabled={!selectedCoach || seatCount >= maxSeats}
                onClick={() => setSeatCount((n) => Math.min(maxSeats, n + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-white text-lg font-bold disabled:opacity-40"
              >
                +
              </button>
              <span className="text-xs font-semibold text-slate">max {maxSeats || 0}</span>
            </div>
          </div>

          <Button
            className="mt-2 w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onContinue}
            disabled={!selectedCoach || seatCount < 1}
          >
            Continue with {seatCount} seat{seatCount === 1 ? '' : 's'}
          </Button>
          <p className="mt-3 text-center text-[10px] leading-relaxed text-slate">
            Next step: passenger details & seat hold. Availability is rechecked before booking.
          </p>
        </div>
      </div>
    </aside>
  )
}

export function MobileContinueBar({
  selectedClass,
  selectedCoach,
  seatCount,
  setSeatCount,
  maxSeats,
  onContinue,
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold uppercase tracking-wider text-primary-deep">
            {selectedClass.code}
            {selectedCoach ? ` · ${selectedCoach.coachNumber}` : ''}
            {selectedCoach ? ` · ${seatCount} seat${seatCount === 1 ? '' : 's'}` : ''}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              disabled={!selectedCoach || seatCount <= 1}
              onClick={() => setSeatCount((n) => Math.max(1, n - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-sm font-bold disabled:opacity-40"
            >
              −
            </button>
            <span className="text-lg font-black text-charcoal">{seatCount}</span>
            <button
              type="button"
              disabled={!selectedCoach || seatCount >= maxSeats}
              onClick={() => setSeatCount((n) => Math.min(maxSeats, n + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-sm font-bold disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
        <Button
          className="shrink-0 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onContinue}
          disabled={!selectedCoach || seatCount < 1}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
