import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import Button from '../../../components/ui/Button'

export function EmptyTrainState({ onBack }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-sky-mist p-4 sm:p-6">
      <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-line bg-white p-6 text-center shadow-card sm:p-8">
        <TrachNexaLogo className="h-16 w-16 text-primary-deep" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-charcoal sm:text-3xl">
          Select a train first
        </h1>
        <p className="mt-2 text-sm text-slate">
          Search a route and choose a train to check live seat availability.
        </p>
        <Button className="mt-6 w-full" onClick={onBack}>
          Back to train search
        </Button>
      </div>
    </main>
  )
}

export default function SeatSelectionHeader({ onBack }) {
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
              Back to results
            </span>
            <span className="truncate font-heading text-base font-bold text-charcoal sm:text-lg">
              Check availability
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
