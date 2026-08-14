import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import { getBookingByPnr } from '../../../api/bookings'
import Button from '../../../components/ui/Button'
import { BookingDetailsSkeleton } from '../../../components/ui/Skeleton'
import { normalizePnrInput, resolveInitialPnr } from '../../../utils/pnr'
import BookingDetailsCard from './BookingDetailsCard'

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
          <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">Check PNR status</h1>
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

        {isSuccess && booking ? <BookingDetailsCard booking={booking} /> : null}
      </div>
    </main>
  )
}
