import { useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import { statusTone } from '../../../utils/bookingStatus'
import { formatDateTime, formatMoney, formatStationName } from '../../../utils/format'

export default function BookingDetailsCard({ booking }) {
  const navigate = useNavigate()
  const source = booking?.journey?.sourceStation
  const destination = booking?.journey?.destinationStation
  const canShowTicket = booking?.status === 'CONFIRMED' || booking?.isActive
  const canCancel = booking?.status === 'CONFIRMED'

  return (
    <>
      <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-line bg-charcoal px-5 py-5 text-white sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">PNR</p>
            <h2 className="mt-1 font-heading text-3xl font-bold tracking-wide">{booking.pnr}</h2>
            <p className="mt-2 text-sm text-white/70">{booking.statusMessage}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusTone(booking.status)}`}
          >
            {booking.status}
          </span>
        </div>

        <div className="border-b-2 border-line px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-aqua-gradient px-3 py-1 text-[10px] font-black uppercase tracking-widest text-charcoal">
              {booking.train?.trainNo}
            </span>
            <span className="rounded-full border-2 border-line px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-deep">
              {booking.classCode}
            </span>
            <span className="rounded-full border-2 border-line px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate">
              {booking.journey?.journeyDate}
            </span>
          </div>
          <h3 className="mt-3 font-heading text-xl font-bold sm:text-2xl">
            {formatStationName(booking.train?.trainName)}
          </h3>

          <div className="mt-5 flex items-start gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-black sm:text-xl">{source?.code}</p>
              <p className="mt-1 truncate text-xs text-slate sm:text-sm">
                {formatStationName(source?.name)}
              </p>
            </div>
            <div className="flex min-w-16 shrink-0 flex-col items-center pt-1 sm:min-w-24">
              <span className="text-[11px] font-bold text-slate">
                {booking.journey?.distanceKm ?? '—'} km
              </span>
              <div className="my-2 flex w-full items-center">
                <span className="h-2 w-2 rounded-full border border-primary-deep" />
                <span className="h-px flex-1 bg-aqua-gradient" />
                <span className="h-2 w-2 rounded-full bg-primary-deep" />
              </div>
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-lg font-black sm:text-xl">{destination?.code}</p>
              <p className="mt-1 truncate text-xs text-slate sm:text-sm">
                {formatStationName(destination?.name)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-deep">
            Passengers · {booking.passengers?.length ?? booking.fare?.passengerCount ?? 0}
          </p>
          {(booking.passengers ?? []).map((passenger) => (
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
                  {passenger.berthPreference ? ` · Pref ${passenger.berthPreference}` : ''}
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

        <div className="grid grid-cols-2 gap-3 border-t-2 border-line p-4 sm:grid-cols-4 sm:p-5">
          {[
            {
              label: 'Total fare',
              value: formatMoney(booking.fare?.totalFare ?? booking.totalFare),
            },
            { label: 'Per passenger', value: formatMoney(booking.fare?.perPassenger) },
            { label: 'Booked', value: formatDateTime(booking.bookedAt) ?? '—' },
            { label: 'Updated', value: formatDateTime(booking.updatedAt) ?? '—' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                {item.label}
              </span>
              <span className="mt-1 text-sm font-extrabold">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        {canShowTicket ? (
          <Button
            className="w-full py-3.5 sm:flex-1"
            onClick={() => navigate(`/booking/ticket/${booking.pnr}`)}
          >
            View ticket
          </Button>
        ) : null}
        {canCancel ? (
          <Button
            variant="ghost"
            className="w-full border-2 border-line py-3.5 sm:flex-1"
            onClick={() => navigate(`/booking/cancel/${booking.pnr}`)}
          >
            Cancel booking
          </Button>
        ) : null}
        <Button
          variant="ghost"
          className="w-full border-2 border-line py-3.5 sm:flex-1"
          onClick={() => navigate('/home')}
        >
          Home
        </Button>
      </div>
    </>
  )
}
