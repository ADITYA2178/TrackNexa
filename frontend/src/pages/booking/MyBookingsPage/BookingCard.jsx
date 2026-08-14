import Button from '../../../components/ui/Button'
import { statusTone } from '../../../utils/bookingStatus'
import { formatMoney, formatStationName } from '../../../utils/format'

export default function BookingCard({ booking, onOpen, onTicket, onCancel }) {
  const source = booking.journey?.sourceStation
  const destination = booking.journey?.destinationStation

  return (
    <article className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-sm transition hover:border-primary-deep hover:shadow-glow">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-line px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-aqua-gradient px-3 py-1 text-[10px] font-black uppercase tracking-widest text-charcoal">
              {booking.train?.trainNo}
            </span>
            <span className="rounded-full border-2 border-line px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-deep">
              {booking.classCode}
            </span>
            <span className="rounded-full border-2 border-line px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate">
              {booking.isUpcoming ? 'Upcoming' : 'Past'}
            </span>
          </div>
          <h2 className="mt-2 font-heading text-lg font-bold text-charcoal sm:text-xl">
            {formatStationName(booking.train?.trainName)}
          </h2>
          <p className="mt-1 font-mono text-sm font-bold tracking-wide text-slate">
            PNR {booking.pnr}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusTone(booking.status)}`}
        >
          {booking.status}
        </span>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-base font-black sm:text-lg">{source?.code}</p>
            <p className="mt-0.5 truncate text-xs text-slate">{formatStationName(source?.name)}</p>
          </div>
          <div className="flex min-w-14 shrink-0 flex-col items-center pt-1">
            <span className="text-[10px] font-bold text-slate">{booking.journey?.journeyDate}</span>
            <div className="my-2 flex w-full items-center">
              <span className="h-2 w-2 rounded-full border border-primary-deep" />
              <span className="h-px flex-1 bg-aqua-gradient" />
              <span className="h-2 w-2 rounded-full bg-primary-deep" />
            </div>
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-base font-black sm:text-lg">{destination?.code}</p>
            <p className="mt-0.5 truncate text-xs text-slate">
              {formatStationName(destination?.name)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-slate">
            {booking.passengers?.length ?? 0} passenger
            {(booking.passengers?.length ?? 0) === 1 ? '' : 's'}
          </span>
          <span className="font-extrabold text-charcoal">{formatMoney(booking.totalFare)}</span>
        </div>

        {booking.status === 'CANCELLED' && booking.refundAmount != null ? (
          <p className="mt-2 text-xs font-semibold text-[#8A3A3A]">
            Refund {formatMoney(booking.refundAmount)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t-2 border-line p-4 sm:flex-row sm:px-5">
        <Button className="w-full py-2.5 text-sm sm:flex-1" onClick={onOpen}>
          Details
        </Button>
        {booking.status === 'CONFIRMED' ? (
          <>
            <Button
              variant="ghost"
              className="w-full border-2 border-line py-2.5 text-sm sm:flex-1"
              onClick={onTicket}
            >
              Ticket
            </Button>
            {booking.isUpcoming ? (
              <Button
                variant="ghost"
                className="w-full border-2 border-line py-2.5 text-sm text-[#8A3A3A] sm:flex-1"
                onClick={onCancel}
              >
                Cancel
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </article>
  )
}
