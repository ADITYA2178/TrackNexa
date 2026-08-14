import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import Button from '../../../components/ui/Button'
import { formatHoldExpiry, formatMoney, formatStationName } from '../../../utils/format'
import { stationLabel } from './holdSummary'

export default function ConfirmForm({
  holdIdInput,
  onHoldIdChange,
  activeHold,
  countdown,
  acknowledged,
  onAcknowledgedChange,
  confirming,
  onBack,
  onPayInstead,
  onConfirm,
}) {
  const sourceLabel = stationLabel(activeHold?.sourceStation)
  const destLabel = stationLabel(activeHold?.destinationStation)
  const passengerCount =
    activeHold?.passengers?.length ?? activeHold?.fare?.passengerCount ?? 0

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
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
                Alternate path
              </span>
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                Confirm hold
              </span>
            </span>
          </button>
          <TrachNexaLogo className="h-9 w-9 shrink-0 text-primary-deep sm:h-10 sm:w-10" />
        </div>
      </header>

      <section className="bg-charcoal text-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-7">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
              Confirm without payment
            </p>
            <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
              Issue PNR from hold
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Uses /api/bookings/confirm. Prefer the payment flow in production; this is for demo /
              offline confirmation.
            </p>
          </div>
          {countdown ? (
            <div
              className={`rounded-2xl px-4 py-3 text-center ${
                countdown.expired ? 'bg-[#E07A7A] text-white' : 'bg-aqua-gradient text-charcoal'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]">
                {countdown.expired ? 'Hold expired' : 'Hold expires in'}
              </p>
              <p className="mt-1 font-heading text-2xl font-black tabular-nums">{countdown.label}</p>
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 pb-28 sm:px-6 sm:py-8">
        <section className="rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-5">
          <label className="flex flex-col rounded-2xl border-2 border-line bg-sky-mist px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-deep">
              Hold ID
            </span>
            <input
              value={holdIdInput}
              onChange={(event) => onHoldIdChange(event.target.value)}
              placeholder="HLD-…"
              className="mt-1 bg-transparent font-mono text-sm font-bold text-charcoal outline-none placeholder:font-semibold placeholder:text-slate"
            />
          </label>

          {activeHold ? (
            <div className="mt-4 rounded-2xl border-2 border-line bg-sky-mist px-4 py-4">
              <p className="font-heading text-lg font-bold">
                Train {activeHold.trainId} · {activeHold.classCode}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate">
                {sourceLabel} → {destLabel}
                {activeHold.journeyDate ? ` · ${activeHold.journeyDate}` : ''}
              </p>
              <p className="mt-2 text-sm font-extrabold text-charcoal">
                {formatMoney(activeHold.fare?.totalFare)} · {passengerCount} passenger
                {passengerCount === 1 ? '' : 's'}
              </p>
              {activeHold.heldUntil ? (
                <p className="mt-2 text-xs font-semibold text-slate">
                  Held until {formatHoldExpiry(activeHold.heldUntil)}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate">
              No matching hold summary in this session. You can still confirm if you have a valid
              hold ID.
            </p>
          )}

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-line bg-[#FFF6E8] px-4 py-3">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => onAcknowledgedChange(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#042A3A]"
            />
            <span className="text-sm font-semibold text-slate">
              I understand this confirms the booking and issues a PNR without collecting payment.
            </span>
          </label>
        </section>

        {activeHold?.passengers?.length ? (
          <section className="rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-deep">
              Held passengers
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {activeHold.passengers.map((passenger) => (
                <div
                  key={`${passenger.seq}-${passenger.fullName}`}
                  className="flex flex-col gap-2 rounded-2xl border-2 border-line bg-sky-mist px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="truncate font-bold">
                    {passenger.seq}. {formatStationName(passenger.fullName)}
                  </p>
                  <span className="shrink-0 rounded-full bg-charcoal px-3 py-1 text-xs font-extrabold text-white">
                    {passenger.allocation?.coachNumber}-{passenger.allocation?.seatNumber}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row">
          <Button
            variant="ghost"
            className="w-full border-2 border-line py-3.5 sm:flex-1"
            onClick={onPayInstead}
          >
            Pay instead
          </Button>
          <Button
            className="w-full py-3.5 sm:flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!holdIdInput.trim() || !acknowledged || confirming || countdown?.expired}
            onClick={onConfirm}
          >
            {confirming ? 'Confirming…' : 'Confirm hold & get PNR'}
          </Button>
        </div>
      </div>
    </main>
  )
}
