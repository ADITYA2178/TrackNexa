import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import { getBookingsByUser, getStoredAuthUser } from '../../../api/bookings'
import Button from '../../../components/ui/Button'
import FilterChip from '../../../components/ui/FilterChip'
import { BookingCardSkeleton } from '../../../components/ui/Skeleton'
import { formatStationName } from '../../../utils/format'
import BookingCard from './BookingCard'
import { JOURNEY_FILTERS, STATUS_FILTERS } from './filters'

export default function MyBookingsPage() {
  const navigate = useNavigate()
  const authUser = getStoredAuthUser()
  const userId = authUser?.id
  const [status, setStatus] = useState('')
  const [journey, setJourney] = useState('upcoming')

  const { data, isFetching, isError, error, refetch } = useQuery({
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

        {isFetching && bookings.length === 0 ? <BookingCardSkeleton count={4} /> : null}

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
          <div className="pointer-events-none opacity-60">
            <BookingCardSkeleton count={2} />
          </div>
        ) : null}
      </div>
    </main>
  )
}
