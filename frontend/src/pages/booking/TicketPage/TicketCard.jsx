import { useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import { formatDateTime, formatMoney, formatStationName } from '../../../utils/format'

export default function TicketCard({ ticket, pnr, onDownloadPdf }) {
  const navigate = useNavigate()
  const source = ticket?.journey?.sourceStation
  const destination = ticket?.journey?.destinationStation
  const isActive = ticket?.isActive ?? ticket?.status === 'CONFIRMED'

  return (
    <>
      <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
        <div className={`px-5 py-5 text-white sm:px-6 ${isActive ? 'bg-charcoal' : 'bg-[#6B2B2B]'}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                {isActive ? 'Electronic reservation slip' : ticket.status}
              </p>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-wide sm:text-4xl">
                {ticket.pnr}
              </h1>
              <p className="mt-2 text-sm text-white/75">{ticket.statusMessage}</p>
              {ticket.ticketRef ? (
                <p className="mt-3 break-all font-mono text-xs text-white/60">
                  Ref {ticket.ticketRef}
                </p>
              ) : null}
            </div>
            {ticket.qr?.imageBase64 ? (
              <div className="mx-auto flex flex-col items-center rounded-2xl bg-white p-3 sm:mx-0">
                <img
                  src={ticket.qr.imageBase64}
                  alt="Ticket QR code"
                  className="h-28 w-28 sm:h-32 sm:w-32"
                />
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate">
                  Scan to verify
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-b-2 border-line px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-aqua-gradient px-3 py-1 text-[10px] font-black uppercase tracking-widest text-charcoal">
              {ticket.train?.trainNo}
            </span>
            <span className="rounded-full border-2 border-line px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-deep">
              {ticket.classCode}
            </span>
            <span className="rounded-full border-2 border-line px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate">
              {ticket.journey?.journeyDate}
            </span>
          </div>
          <h2 className="mt-3 font-heading text-xl font-bold sm:text-2xl">
            {formatStationName(ticket.train?.trainName)}
          </h2>

          <div className="mt-5 flex items-start gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-black sm:text-xl">{source?.code ?? source}</p>
              <p className="mt-1 truncate text-xs text-slate sm:text-sm">
                {formatStationName(source?.name)}
              </p>
            </div>
            <div className="flex min-w-16 shrink-0 flex-col items-center pt-1 sm:min-w-24">
              <span className="text-[11px] font-bold text-slate">
                {ticket.journey?.distanceKm ?? '—'} km
              </span>
              <div className="my-2 flex w-full items-center">
                <span className="h-2 w-2 rounded-full border border-primary-deep" />
                <span className="h-px flex-1 bg-aqua-gradient" />
                <span className="h-2 w-2 rounded-full bg-primary-deep" />
              </div>
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-lg font-black sm:text-xl">{destination?.code ?? destination}</p>
              <p className="mt-1 truncate text-xs text-slate sm:text-sm">
                {formatStationName(destination?.name)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-deep">
            Passengers · {ticket.passengers?.length ?? 0}
          </p>
          {(ticket.passengers ?? []).map((passenger) => (
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

        <div className="grid grid-cols-2 gap-3 border-t-2 border-line p-4 sm:grid-cols-3 sm:p-5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
              Fare
            </span>
            <span className="mt-1 text-sm font-extrabold">
              {formatMoney(ticket.fare?.totalFare ?? ticket.totalFare)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
              Per passenger
            </span>
            <span className="mt-1 text-sm font-extrabold">
              {formatMoney(ticket.fare?.perPassenger)}
            </span>
          </div>
          <div className="col-span-2 flex flex-col sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
              Booked at
            </span>
            <span className="mt-1 text-sm font-extrabold">
              {formatDateTime(ticket.bookedAt) ?? '—'}
            </span>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:flex-wrap">
        <Button className="w-full py-3.5 sm:min-w-[10rem] sm:flex-1" onClick={onDownloadPdf}>
          Download PDF
        </Button>
        {ticket.qr?.payload ? (
          <Button
            variant="ghost"
            className="w-full border-2 border-line py-3.5 sm:min-w-[10rem] sm:flex-1"
            onClick={() =>
              navigate('/booking/verify-ticket', {
                state: { qrPayload: ticket.qr.payload },
              })
            }
          >
            Verify QR
          </Button>
        ) : null}
        <Button
          variant="ghost"
          className="w-full border-2 border-line py-3.5 sm:min-w-[10rem] sm:flex-1"
          onClick={() => navigate(`/booking/pnr/${pnr}`)}
        >
          Booking details
        </Button>
        <Button
          variant="ghost"
          className="w-full border-2 border-line py-3.5 sm:min-w-[10rem] sm:flex-1"
          onClick={() => navigate('/home')}
        >
          Home
        </Button>
      </div>
    </>
  )
}
