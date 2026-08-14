import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import Button from '../../../components/ui/Button'
import { formatMoney, formatStationName } from '../../../utils/format'

export default function VerifySuccessView({
  result,
  pnr,
  amount,
  hold,
  ticketPassengers,
  onViewTicket,
  onHome,
}) {
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
            onClick={onViewTicket}
            disabled={!pnr}
          >
            View ticket
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
