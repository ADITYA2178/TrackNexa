import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import Button from '../../../components/ui/Button'
import { formatHoldExpiry, formatMoney } from '../../../utils/format'

export default function HoldSuccessView({ holdResult, onPayment, onConfirm, onHome }) {
  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
              Hold confirmed
            </span>
            <span className="truncate font-heading text-base font-bold sm:text-lg">
              Seats reserved
            </span>
          </div>
          <TrachNexaLogo className="h-9 w-9 shrink-0 text-primary-deep sm:h-10 sm:w-10" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
          <div className="bg-charcoal px-5 py-5 text-white sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              Hold ID
            </p>
            <h1 className="mt-1 break-all font-heading text-2xl font-bold sm:text-3xl">
              {holdResult.holdId}
            </h1>
            <p className="mt-3 text-sm text-white/75">
              Expires around{' '}
              {formatHoldExpiry(holdResult.heldUntil) ??
                `${holdResult.holdExpiresInMinutes ?? 10} min`}
              {' · '}
              Complete payment before the hold lapses.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b-2 border-line p-4 sm:grid-cols-4 sm:p-5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                Train
              </span>
              <span className="mt-1 text-sm font-extrabold">{holdResult.trainId}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                Class
              </span>
              <span className="mt-1 text-sm font-extrabold">{holdResult.classCode}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                Date
              </span>
              <span className="mt-1 text-sm font-extrabold">{holdResult.journeyDate}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                Fare
              </span>
              <span className="mt-1 text-sm font-extrabold">
                {formatMoney(holdResult.fare?.totalFare)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-deep">
              Allocated berths
            </p>
            {(holdResult.passengers ?? []).map((passenger) => (
              <div
                key={`${passenger.seq}-${passenger.fullName}`}
                className="flex flex-col gap-2 rounded-2xl border-2 border-line bg-sky-mist px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-charcoal">
                    {passenger.seq}. {passenger.fullName}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate">
                    Age {passenger.age} · {passenger.gender}
                    {passenger.preferenceMatched ? ' · Pref matched' : ''}
                  </p>
                </div>
                <div className="shrink-0 rounded-full bg-charcoal px-3 py-1.5 text-xs font-extrabold text-white">
                  {passenger.allocation?.coachNumber}-{passenger.allocation?.seatNumber}
                  {' · '}
                  {passenger.allocation?.berthType || 'SEAT'}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="w-full py-3.5 sm:flex-1" onClick={onPayment}>
            Continue to payment
          </Button>
          <Button
            variant="ghost"
            className="w-full border-2 border-line py-3.5 sm:flex-1"
            onClick={onConfirm}
          >
            Confirm without payment
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
