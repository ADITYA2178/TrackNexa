import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import {
  CANCEL_REASONS,
  cancelBooking,
  estimateRefund,
  getBookingByPnr,
  getStoredAuthUser,
} from '../../api/bookings'
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

export default function CancelBookingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pnr } = useParams()
  const [reason, setReason] = useState('USER_REQUESTED')
  const [customReason, setCustomReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [cancelResult, setCancelResult] = useState(null)

  const {
    data: booking,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['booking-by-pnr', pnr],
    queryFn: () => getBookingByPnr(pnr),
    enabled: /^\d{10}$/.test(pnr || ''),
    staleTime: 15_000,
    retry: false,
  })

  const refundPreview = useMemo(() => {
    if (!booking) return null
    return estimateRefund(
      booking.fare?.totalFare ?? booking.totalFare,
      booking.journey?.journeyDate,
    )
  }, [booking])

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: (data) => {
      setCancelResult(data)
      queryClient.invalidateQueries({ queryKey: ['booking-by-pnr', pnr] })
      toast.success(data?.message ?? 'Booking cancelled')
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const handleCancel = () => {
    if (!booking?.pnr) return
    if (!confirmed) {
      toast.error('Confirm that you want to cancel this booking')
      return
    }
    if (refundPreview && !refundPreview.allowed) {
      toast.error('This booking can no longer be cancelled')
      return
    }

    const authUser = getStoredAuthUser()
    const finalReason =
      reason === 'OTHER'
        ? customReason.trim() || 'OTHER'
        : reason

    if (reason === 'OTHER' && !customReason.trim()) {
      toast.error('Please describe your reason')
      return
    }

    cancelMutation.mutate({
      pnr: booking.pnr,
      userId: authUser?.id ?? null,
      reason: finalReason.slice(0, 500),
    })
  }

  if (!/^\d{10}$/.test(pnr || '')) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-sky-mist p-4 sm:p-6">
        <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-line bg-white p-6 text-center shadow-card sm:p-8">
          <TrachNexaLogo className="h-16 w-16 text-primary-deep" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-charcoal sm:text-3xl">
            Invalid PNR
          </h1>
          <p className="mt-2 text-sm text-slate">Open cancel from a confirmed booking details page.</p>
          <Button className="mt-6 w-full" onClick={() => navigate('/booking/pnr')}>
            Check PNR status
          </Button>
        </div>
      </main>
    )
  }

  if (cancelResult) {
    return (
      <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
        <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                Cancellation complete
              </span>
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                Booking cancelled
              </span>
            </div>
            <TrachNexaLogo className="h-9 w-9 shrink-0 text-primary-deep sm:h-10 sm:w-10" />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
          <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
            <div className="bg-[#6B2B2B] px-5 py-6 text-white sm:px-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F3B4B4]">
                PNR cancelled
              </p>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-wide sm:text-4xl">
                {cancelResult.pnr}
              </h1>
              <p className="mt-3 text-sm text-white/75">{cancelResult.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b-2 border-line p-4 sm:grid-cols-4 sm:p-5">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Status
                </span>
                <span className="mt-1 text-sm font-extrabold">{cancelResult.status}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Cancelled at
                </span>
                <span className="mt-1 text-sm font-extrabold">
                  {formatDateTime(cancelResult.cancelledAt) ?? '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Total fare
                </span>
                <span className="mt-1 text-sm font-extrabold">
                  {formatMoney(cancelResult.totalFare)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Refund
                </span>
                <span className="mt-1 text-sm font-extrabold text-primary-deep">
                  {formatMoney(cancelResult.refund?.amount ?? cancelResult.refundAmount)}
                  {cancelResult.refund?.percent != null
                    ? ` (${cancelResult.refund.percent}%)`
                    : ''}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-deep">
                Released seats
              </p>
              {(cancelResult.cancelledPassengers ?? []).map((passenger) => (
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
                    {passenger.releasedSeat?.coachNumber}-{passenger.releasedSeat?.seatNumber}
                    {' · '}
                    {passenger.releasedSeat?.berthType || 'SEAT'}
                  </span>
                </div>
              ))}
              {cancelResult.cancellationReason ? (
                <p className="rounded-2xl bg-sky-mist px-4 py-3 text-sm text-slate">
                  Reason: <span className="font-semibold text-charcoal">{cancelResult.cancellationReason}</span>
                </p>
              ) : null}
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="w-full py-3.5 sm:flex-1"
              onClick={() => navigate(`/booking/pnr/${cancelResult.pnr}`)}
            >
              View booking status
            </Button>
            <Button
              variant="ghost"
              className="w-full border-2 border-line py-3.5 sm:flex-1"
              onClick={() => navigate('/home')}
            >
              Back to home
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const source = booking?.journey?.sourceStation
  const destination = booking?.journey?.destinationStation
  const alreadyCancelled = booking?.status === 'CANCELLED'
  const cannotCancel =
    booking && booking.status !== 'CONFIRMED'
      ? true
      : Boolean(refundPreview && !refundPreview.allowed)

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(`/booking/pnr/${pnr}`)}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-soft text-charcoal">
              ←
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                Back to details
              </span>
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                Cancel booking
              </span>
            </span>
          </button>
          <TrachNexaLogo className="h-9 w-9 shrink-0 text-primary-deep sm:h-10 sm:w-10" />
        </div>
      </header>

      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
            Cancellation
          </p>
          <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
            Cancel PNR {pnr}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Seats are released immediately. Refund depends on how close you are to the journey date.
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 pb-28 sm:px-6 sm:py-8">
        {isFetching && !booking ? <BookingDetailsSkeleton /> : null}

        {isError ? (
          <div className="rounded-3xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-8 text-center">
            <p className="font-heading text-lg font-bold text-charcoal">Couldn’t load booking</p>
            <p className="mt-2 text-sm text-slate">{error.message}</p>
            <Button className="mt-5" onClick={() => navigate('/booking/pnr')}>
              Check another PNR
            </Button>
          </div>
        ) : null}

        {booking ? (
          <>
            <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-sm">
              <div className="border-b-2 border-line px-5 py-4 sm:px-6">
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
                <h2 className="mt-3 font-heading text-xl font-bold">
                  {formatStationName(booking.train?.trainName)}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate">
                  {source?.code} → {destination?.code} · {formatMoney(booking.fare?.totalFare)}
                </p>
              </div>

              <div className="px-5 py-4 sm:px-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-deep">
                  Estimated refund
                </p>
                {refundPreview?.allowed ? (
                  <div className="mt-3 rounded-2xl bg-sky-mist px-4 py-4">
                    <p className="font-heading text-2xl font-bold text-charcoal">
                      {formatMoney(refundPreview.refundAmount)}
                      <span className="ml-2 text-base font-semibold text-primary-deep">
                        ({refundPreview.refundPercent}%)
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-slate">{refundPreview.label}</p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-4">
                    <p className="font-bold text-charcoal">
                      {alreadyCancelled
                        ? 'This booking is already cancelled'
                        : refundPreview?.label || 'Cancellation not available'}
                    </p>
                    <p className="mt-1 text-sm text-slate">{booking.statusMessage}</p>
                  </div>
                )}
              </div>
            </section>

            {!cannotCancel && !alreadyCancelled ? (
              <section className="rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-deep">
                  Reason
                </p>
                <h2 className="mt-1 font-heading text-xl font-bold">Why are you cancelling?</h2>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CANCEL_REASONS.map((item) => {
                    const active = reason === item.value
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setReason(item.value)}
                        className={`rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                          active
                            ? 'border-charcoal bg-charcoal text-white'
                            : 'border-line bg-white hover:border-primary-deep'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>

                {reason === 'OTHER' ? (
                  <label className="mt-4 flex flex-col rounded-2xl border-2 border-line bg-sky-mist px-4 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-deep">
                      Tell us more
                    </span>
                    <textarea
                      value={customReason}
                      onChange={(event) => setCustomReason(event.target.value.slice(0, 500))}
                      rows={3}
                      placeholder="Brief reason for cancellation"
                      className="mt-2 resize-none bg-transparent text-sm font-semibold text-charcoal outline-none placeholder:font-medium placeholder:text-slate"
                    />
                  </label>
                ) : null}

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-line bg-sky-mist px-4 py-3">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#042A3A]"
                  />
                  <span className="text-sm font-semibold text-slate">
                    I understand seats will be released and refund follows the policy above.
                  </span>
                </label>
              </section>
            ) : null}
          </>
        ) : null}
      </div>

      {booking && !alreadyCancelled && !cannotCancel ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">
                Est. refund {formatMoney(refundPreview?.refundAmount)}
              </p>
              <p className="truncate text-sm font-semibold text-slate">PNR {pnr}</p>
            </div>
            <Button
              className="w-full bg-[#8A3A3A] py-3.5 text-white hover:bg-[#6B2B2B] sm:w-auto sm:px-8 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!confirmed || cancelMutation.isPending}
              onClick={handleCancel}
            >
              {cancelMutation.isPending ? 'Cancelling…' : 'Confirm cancellation'}
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
