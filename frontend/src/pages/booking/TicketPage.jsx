import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import { downloadTicketPdf, getTicketByPnr } from '../../api/bookings'
import { getStoredConfirmedBooking } from '../../api/payments'
import Button from '../../components/ui/Button'
import { TicketSkeleton } from '../../components/ui/Skeleton'

function formatStationName(name = '') {
  return String(name || '')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function formatBookedAt(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function resolvePnr(paramPnr) {
  if (paramPnr && /^\d{10}$/.test(paramPnr)) return paramPnr
  const confirmed = getStoredConfirmedBooking()
  return (
    confirmed?.booking?.pnr ??
    confirmed?.ticket?.pnr ??
    null
  )
}

export default function TicketPage() {
  const navigate = useNavigate()
  const { pnr: paramPnr } = useParams()
  const pnr = resolvePnr(paramPnr)

  const {
    data: ticket,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ticket', pnr],
    queryFn: () => getTicketByPnr(pnr),
    enabled: Boolean(pnr),
    staleTime: 60_000,
    retry: false,
  })

  const handleDownloadPdf = async () => {
    try {
      const { blob, filename } = await downloadTicketPdf(pnr)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success('Ticket PDF downloaded')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (!pnr) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-sky-mist p-4 sm:p-6">
        <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-line bg-white p-6 text-center shadow-card sm:p-8">
          <TrachNexaLogo className="h-16 w-16 text-primary-deep" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-charcoal sm:text-3xl">
            No PNR found
          </h1>
          <p className="mt-2 text-sm text-slate">
            Complete a booking first, then open your e-ticket from the confirmation screen.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/home')}>
            Back to home
          </Button>
        </div>
      </main>
    )
  }

  const source = ticket?.journey?.sourceStation
  const destination = ticket?.journey?.destinationStation
  const isActive = ticket?.isActive ?? ticket?.status === 'CONFIRMED'

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-soft text-charcoal">
              ←
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                E-ticket
              </span>
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                PNR {pnr}
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

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 pb-10 sm:px-6 sm:py-8">
        {isFetching && !ticket ? <TicketSkeleton /> : null}

        {isError ? (
          <div className="rounded-3xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-8 text-center sm:px-6">
            <p className="font-heading text-lg font-bold text-charcoal">Couldn’t load ticket</p>
            <p className="mt-2 text-sm text-slate">{error.message}</p>
            <Button className="mt-5" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : null}

        {ticket ? (
          <>
            <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
              <div
                className={`px-5 py-5 text-white sm:px-6 ${
                  isActive ? 'bg-charcoal' : 'bg-[#6B2B2B]'
                }`}
              >
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
                    <p className="text-lg font-black sm:text-xl">
                      {source?.code ?? source}
                    </p>
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
                    <p className="text-lg font-black sm:text-xl">
                      {destination?.code ?? destination}
                    </p>
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
                    {formatBookedAt(ticket.bookedAt) ?? '—'}
                  </span>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:flex-wrap">
              <Button className="w-full py-3.5 sm:min-w-[10rem] sm:flex-1" onClick={handleDownloadPdf}>
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
        ) : null}
      </div>
    </main>
  )
}
