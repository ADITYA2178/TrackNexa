import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createSeatHold,
  getStoredAuthUser,
  getStoredHoldDraft,
  storeActiveHold,
} from '../../../api/bookings'
import HoldEmptyState from './HoldEmptyState'
import HoldSuccessView from './HoldSuccessView'
import PassengerForm from './PassengerForm'
import {
  emptyPassenger,
  toHoldPayload,
  updatePassengerAt,
  validatePassengers,
} from './passengerModel'
import {
  HoldPageHeader,
  HoldSidebar,
  MobileHoldBar,
  TrainHoldSummary,
} from './TrainHoldSummary'

export default function PassengerHoldPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const draft = location.state ?? getStoredHoldDraft()
  const train = draft?.train
  const search = draft?.search
  const availability = draft?.availability
  const seatCount = Math.min(Math.max(Number(availability?.seatCount) || 1, 1), 6)

  const [passengers, setPassengers] = useState(() =>
    Array.from({ length: seatCount }, () => emptyPassenger()),
  )
  const [holdResult, setHoldResult] = useState(null)

  const journeyDate = train?.journeyDate ?? search?.date
  const sourceStation = train?.from?.code ?? search?.from
  const destinationStation = train?.to?.code ?? search?.to

  const holdMutation = useMutation({
    mutationFn: createSeatHold,
    onSuccess: (data) => {
      storeActiveHold(data)
      setHoldResult(data)
      toast.success(data?.message ?? 'Seats held successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updatePassenger = (index, key, value) => {
    setPassengers((current) => updatePassengerAt(current, index, key, value))
  }

  const handleHold = () => {
    if (!train || !availability) {
      toast.error('Missing trip details. Pick seats again.')
      return
    }
    if (!validatePassengers(passengers, toast)) return

    const authUser = getStoredAuthUser()
    holdMutation.mutate({
      trainId: train.trainNo,
      journeyDate,
      sourceStation,
      destinationStation,
      classCode: availability.classCode,
      userId: authUser?.id ?? null,
      passengers: toHoldPayload(passengers),
    })
  }

  const summaryBits = useMemo(
    () => ({
      classCode: availability?.classCode,
      className: availability?.className,
      preferredCoach: availability?.coach?.coachNumber,
      seatCount,
    }),
    [availability, seatCount],
  )

  if (!train || !availability) {
    return <HoldEmptyState onBack={() => navigate('/home')} />
  }

  if (holdResult) {
    return (
      <HoldSuccessView
        holdResult={holdResult}
        onPayment={() => navigate('/booking/payment', { state: { hold: holdResult } })}
        onConfirm={() => navigate('/booking/confirm', { state: { hold: holdResult } })}
        onHome={() => navigate('/home')}
      />
    )
  }

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <HoldPageHeader
        onBack={() =>
          navigate(`/trains/${train.trainNo}/seats`, { state: { train, search } })
        }
      />
      <TrainHoldSummary
        train={train}
        journeyDate={journeyDate}
        sourceStation={sourceStation}
        destinationStation={destinationStation}
        summaryBits={summaryBits}
        seatCount={seatCount}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 pb-28 sm:px-6 lg:flex-row lg:pb-8 lg:px-8">
        <PassengerForm
          passengers={passengers}
          seatCount={seatCount}
          onUpdate={updatePassenger}
        />
        <HoldSidebar
          summaryBits={summaryBits}
          seatCount={seatCount}
          onHold={handleHold}
          isPending={holdMutation.isPending}
        />
      </div>
      <MobileHoldBar
        summaryBits={summaryBits}
        seatCount={seatCount}
        sourceStation={sourceStation}
        destinationStation={destinationStation}
        onHold={handleHold}
        isPending={holdMutation.isPending}
      />
    </main>
  )
}
