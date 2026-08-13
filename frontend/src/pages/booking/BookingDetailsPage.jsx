import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import { getBookingByPnr } from '../../api/bookings'
import { getStoredConfirmedBooking } from '../../api/payments'
import Button from '../../components/ui/Button'
import { BookingDetailsSkeleton } from '../../components/ui/Skeleton'

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

function formatDateTime(value) {
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

function normalizePnrInput(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10)
}

function resolveInitialPnr(paramPnr) {
  if (paramPnr && /^\d{10}$/.test(paramPnr)) return paramPnr
  const confirmed = getStoredConfirmedBooking()
  return confirmed?.booking?.pnr ?? confirmed?.ticket?.pnr ?? ''
}

function statusTone(status) {
  if (status === 'CONFIRMED') return 'bg-sky-soft text-primary-deep'
  if (status === 'CANCELLED') return 'bg-[#FFF0F0] text-[#8A3A3A]'
  if (status === 'EXPIRED') return 'bg-[#FFF6E8] text-[#8A5A20]'
  return 'bg-sky-mist text-slate'
}

export default function BookingDetailsPage() {
  const navigate = useNavigate()
  const { pnr: paramPnr } = useParams()
  const [pnrInput, setPnrInput] = useState(() => resolveInitialPnr(paramPnr))
  const [lookupPnr, setLookupPnr] = useState(() => resolveInitialPnr(paramPnr))

  useEffect(() => {
    if (paramPnr && /^\d{10}$/.test(paramPnr)) {
      setPnrInput(paramPnr)
      setLookupPnr(paramPnr)
    }
  }, [paramPnr])

  const {
    data: booking,
    isFetching,
    isError,
    error,
    refetch,
    isSuccess,
  } = useQuery({
    queryKey: ['booking-by-pnr', lookupPnr],
    queryFn: () => getBookingByPnr(lookupPnr),
    enabled: /^\d{10}$/.test(lookupPnr),
    staleTime: 30_000,
    retry: false,
  })

  const handleLookup = (event) => {
    event.preventDefault()
    const next = normalizePnrInput(pnrInput)
    if (!/^\d{10}$/.test(next)) {
      toast.error('Enter a valid 10-digit PNR')
      return
    }
    setLookupPnr(next)
    if (paramPnr !== next) {
      navigate(`/booking/pnr/${next}`, { replace: Boolean(paramPnr) })
    }
  }

  const source = booking?.journey?.sourceStation
  const destination = booking?.journey?.destinationStation
  const canShowTicket = booking?.status === 'CONFIRMED' || booking?.isActive
  const canCancel = booking?.status === 'CONFIRMED'

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-soft text-charcoal">
              ←
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                PNR status
              </span>
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                Booking details
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

      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
            Look up booking
          </p>
          <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
            Check PNR status
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Enter your 10-digit PNR to see journey, passengers, and fare details.
          </p>

          <form
            onSubmit={handleLookup}
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch"
          >
            <label className="flex min-w-0 flex-1 flex-col rounded-2xl border-2 border-white/15 bg-white/5 px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondary">
                PNR number
              </span>
              <input
                value={pnrInput}
                onChange={(event) => setPnrInput(normalizePnrInput(event.target.value))}
                placeholder="1234567890"
                inputMode="numeric"
                maxLength={10}
                className="mt-1 w-full bg-transparent text-lg font-extrabold tracking-[0.12em] text-white outline-none placeholder:font-semibold placeholder:tracking-normal placeholder:text-white/35"
              />
            </label>
            <Button
              type="submit"
              className="bg-aqua-gradient px-6 py-3.5 text-charcoal hover:opacity-95 sm:self-stretch"
              disabled={isFetching}
            >
              {isFetching ? 'Checking…' : 'Check status'}
            </Button>
          </form>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 pb-10 sm:px-6 sm:py-8">
        {!lookupPnr ? (
          <div className="rounded-3xl border-2 border-dashed border-line bg-white px-4 py-12 text-center">
            <p className="font-heading text-lg font-bold text-charcoal">Enter a PNR above</p>
            <p className="mt-2 text-sm text-slate">
              You can also open this page from a confirmed booking’s ticket screen.
            </p>
          </div>
        ) : null}

        {lookupPnr && isFetching && !booking ? <BookingDetailsSkeleton /> : null}

        {isError ? (
          <div className="rounded-3xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-8 text-center sm:px-6">
            <p className="font-heading text-lg font-bold text-charcoal">PNR not found</p>
            <p className="mt-2 text-sm text-slate">{error.message}</p>
            <Button className="mt-5" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : null}

        {isSuccess && booking ? (
          <>
            <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-line bg-charcoal px-5 py-5 text-white sm:px-6">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                    PNR
                  </p>
                  <h2 className="mt-1 font-heading text-3xl font-bold tracking-wide">
                    {booking.pnr}
                  </h2>
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
                        {passenger.berthPreference
                          ? ` · Pref ${passenger.berthPreference}`
                          : ''}
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
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                    Total fare
                  </span>
                  <span className="mt-1 text-sm font-extrabold">
                    {formatMoney(booking.fare?.totalFare ?? booking.totalFare)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                    Per passenger
                  </span>
                  <span className="mt-1 text-sm font-extrabold">
                    {formatMoney(booking.fare?.perPassenger)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                    Booked
                  </span>
                  <span className="mt-1 text-sm font-extrabold">
                    {formatDateTime(booking.bookedAt) ?? '—'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                    Updated
                  </span>
                  <span className="mt-1 text-sm font-extrabold">
                    {formatDateTime(booking.updatedAt) ?? '—'}
                  </span>
                </div>
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
        ) : null}
      </div>
    </main>
  )
}
