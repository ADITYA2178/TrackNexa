import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import { getBookingsByUser, getStoredAuthUser } from '../../api/bookings'
import Button from '../../components/ui/Button'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'EXPIRED', label: 'Expired' },
]

const JOURNEY_FILTERS = [
  { value: '', label: 'Any date' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

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

function statusTone(status) {
  if (status === 'CONFIRMED') return 'bg-sky-soft text-primary-deep'
  if (status === 'CANCELLED') return 'bg-[#FFF0F0] text-[#8A3A3A]'
  if (status === 'EXPIRED') return 'bg-[#FFF6E8] text-[#8A5A20]'
  return 'bg-sky-mist text-slate'
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider transition sm:text-[11px] ${
        active
          ? 'bg-charcoal text-white'
          : 'bg-white text-slate border-2 border-line hover:border-primary-deep'
      }`}
    >
      {children}
    </button>
  )
}

function BookingCard({ booking, onOpen, onTicket, onCancel }) {
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
            {booking.isUpcoming ? (
              <span className="rounded-full border-2 border-line px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate">
                Upcoming
              </span>
            ) : (
              <span className="rounded-full border-2 border-line px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate">
                Past
              </span>
            )}
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
            <p className="mt-0.5 truncate text-xs text-slate">
              {formatStationName(source?.name)}
            </p>
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

export default function MyBookingsPage() {
  const navigate = useNavigate()
  const authUser = getStoredAuthUser()
  const userId = authUser?.id
  const [status, setStatus] = useState('')
  const [journey, setJourney] = useState('upcoming')

  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bookings-by-user', userId, status, journey],
    queryFn: () =>
      getBookingsByUser(userId, {
        status: status || null,
        journey: journey || null,
      }),
    enabled: Boolean(userId),
    staleTime: 20_000,
    retry: false,
  })

  const bookings = data?.bookings ?? []
  const displayName = useMemo(() => {
    const name = authUser?.full_name || authUser?.fullName || ''
    return formatStationName(name) || 'Traveler'
  }, [authUser])

  if (!userId) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-sky-mist p-4 sm:p-6">
        <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-line bg-white p-6 text-center shadow-card sm:p-8">
          <TrachNexaLogo className="h-16 w-16 text-primary-deep" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-charcoal sm:text-3xl">
            Sign in again
          </h1>
          <p className="mt-2 text-sm text-slate">
            Your user profile isn’t stored in this browser session. Log in once more so we can load
            bookings linked to your account.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
            Go to login
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
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
                {displayName}
              </span>
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                My bookings
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
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
            Your trips
          </p>
          <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl md:text-4xl">
            Bookings for {displayName}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {data?.total != null
              ? `${data.total} booking${data.total === 1 ? '' : 's'} with current filters`
              : 'Filter by status and journey date'}
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-3">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {STATUS_FILTERS.map((item) => (
              <FilterChip
                key={`status-${item.value || 'all'}`}
                active={status === item.value}
                onClick={() => setStatus(item.value)}
              >
                {item.label}
              </FilterChip>
            ))}
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {JOURNEY_FILTERS.map((item) => (
              <FilterChip
                key={`journey-${item.value || 'any'}`}
                active={journey === item.value}
                onClick={() => setJourney(item.value)}
              >
                {item.label}
              </FilterChip>
            ))}
          </div>
        </section>

        {isFetching && bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line bg-white px-4 py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-deep border-t-transparent" />
            <p className="mt-4 text-sm font-semibold text-slate">Loading your bookings…</p>
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-3xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-8 text-center">
            <p className="font-heading text-lg font-bold text-charcoal">Couldn’t load bookings</p>
            <p className="mt-2 text-sm text-slate">{error.message}</p>
            <Button className="mt-5" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : null}

        {!isFetching && !isError && bookings.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-line bg-white px-4 py-12 text-center">
            <p className="font-heading text-lg font-bold text-charcoal">No bookings found</p>
            <p className="mt-2 text-sm text-slate">
              Confirmed trips linked to your account will show up here. Try clearing filters or book
              a new journey.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:mx-auto sm:max-w-md sm:flex-row">
              <Button className="w-full sm:flex-1" onClick={() => navigate('/home')}>
                Book a train
              </Button>
              <Button
                variant="ghost"
                className="w-full border-2 border-line sm:flex-1"
                onClick={() => navigate('/booking/pnr')}
              >
                Check PNR
              </Button>
            </div>
          </div>
        ) : null}

        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.pnr}
                booking={booking}
                onOpen={() => navigate(`/booking/pnr/${booking.pnr}`)}
                onTicket={() => navigate(`/booking/ticket/${booking.pnr}`)}
                onCancel={() => navigate(`/booking/cancel/${booking.pnr}`)}
              />
            ))}
          </div>
        ) : null}

        {isFetching && bookings.length > 0 ? (
          <p className="text-center text-xs font-semibold text-slate">Refreshing…</p>
        ) : null}
      </div>
    </main>
  )
}
