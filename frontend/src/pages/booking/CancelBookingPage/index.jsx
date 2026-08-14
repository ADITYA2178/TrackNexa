import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import {
  cancelBooking,
  estimateRefund,
  getBookingByPnr,
  getStoredAuthUser,
} from '../../../api/bookings'
import Button from '../../../components/ui/Button'
import { BookingDetailsSkeleton } from '../../../components/ui/Skeleton'
import BookingCancelSummary from './BookingCancelSummary'
import CancelForm from './CancelForm'
import CancelSuccessView from './CancelSuccessView'

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
    const finalReason = reason === 'OTHER' ? customReason.trim() || 'OTHER' : reason

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
          <p className="mt-2 text-sm text-slate">
            Open cancel from a confirmed booking details page.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/booking/pnr')}>
            Check PNR status
          </Button>
        </div>
      </main>
    )
  }

  if (cancelResult) {
    return (
      <CancelSuccessView
        cancelResult={cancelResult}
        onViewStatus={() => navigate(`/booking/pnr/${cancelResult.pnr}`)}
        onHome={() => navigate('/home')}
      />
    )
  }

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
          <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">Cancel PNR {pnr}</h1>
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
            <BookingCancelSummary
              booking={booking}
              refundPreview={refundPreview}
              alreadyCancelled={alreadyCancelled}
            />
            {!cannotCancel && !alreadyCancelled ? (
              <CancelForm
                reason={reason}
                onReasonChange={setReason}
                customReason={customReason}
                onCustomReasonChange={setCustomReason}
                confirmed={confirmed}
                onConfirmedChange={setConfirmed}
                refundPreview={refundPreview}
                pnr={pnr}
                cancelling={cancelMutation.isPending}
                onCancel={handleCancel}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  )
}
