import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { getSeatAvailability, TRAVEL_CLASSES } from '../../../api/availability'
import CoachGridSection from './CoachGridSection'
import SeatSelectionHeader, { EmptyTrainState } from './SeatSelectionHeader'
import { getStoredSelection } from './selectionStorage'
import {
  MobileContinueBar,
  TrainSummary,
  TripSummaryAside,
} from './TrainSummary'

export default function SeatSelectionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const selection = location.state ?? getStoredSelection()
  const train = selection?.train
  const search = selection?.search

  const journeyDate = train?.journeyDate ?? search?.date
  const sourceStation = train?.from?.code ?? search?.from
  const destinationStation = train?.to?.code ?? search?.to
  const trainId = train?.trainNo

  const [selectedClass, setSelectedClass] = useState(TRAVEL_CLASSES[0])
  const [selectedCoach, setSelectedCoach] = useState(null)
  const [seatCount, setSeatCount] = useState(1)
  const [classCache, setClassCache] = useState({})

  const canQuery = Boolean(
    trainId && journeyDate && sourceStation && destinationStation && selectedClass?.code,
  )

  const {
    data: availability,
    isFetching,
    isError,
    error,
    isSuccess,
  } = useQuery({
    queryKey: [
      'seat-availability',
      trainId,
      journeyDate,
      sourceStation,
      destinationStation,
      selectedClass.code,
    ],
    queryFn: () =>
      getSeatAvailability({
        trainId,
        journeyDate,
        sourceStation,
        destinationStation,
        classCode: selectedClass.code,
      }),
    enabled: canQuery,
    retry: false,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!isSuccess || !availability) return
    setClassCache((current) => ({ ...current, [selectedClass.code]: availability }))
    setSelectedCoach(null)
    setSeatCount(1)
  }, [availability, isSuccess, selectedClass.code])

  useEffect(() => {
    if (!isError) return
    const message = error?.message ?? ''
    setClassCache((current) => ({
      ...current,
      [selectedClass.code]: {
        notOffered: true,
        availableSeats: 0,
        totalSeats: 0,
        coaches: [],
        status: 'NOT_AVAILABLE',
        message,
      },
    }))
    setSelectedCoach(null)
  }, [isError, error, selectedClass.code])

  const coaches = useMemo(() => {
    const list = availability?.coaches ?? []
    return [...list].sort((a, b) => (a.positionSeq ?? 0) - (b.positionSeq ?? 0))
  }, [availability])

  const maxSeats = selectedCoach?.availableSeats ?? 0

  useEffect(() => {
    if (seatCount > maxSeats && maxSeats > 0) setSeatCount(maxSeats)
  }, [maxSeats, seatCount])

  if (!train) return <EmptyTrainState onBack={() => navigate('/home')} />

  const continueBooking = () => {
    if (!selectedCoach) {
      toast.error('Select a coach with available seats')
      return
    }
    if (seatCount < 1) {
      toast.error('Choose at least 1 seat')
      return
    }
    const payload = {
      train,
      search: { from: sourceStation, to: destinationStation, date: journeyDate },
      availability: {
        classCode: selectedClass.code,
        className: selectedClass.name,
        coach: selectedCoach,
        seatCount,
        snapshot: availability,
      },
    }
    sessionStorage.setItem('seatHoldDraft', JSON.stringify(payload))
    navigate('/booking/hold', { state: payload })
  }

  const activeCache = classCache[selectedClass.code]
  const classNotOfferedMessage =
    /not available on train/i.test(error?.message ?? '') ||
    /CLASS_NOT_AVAILABLE/i.test(error?.message ?? '')
  const showNotOffered =
    !isFetching && (Boolean(activeCache?.notOffered) || (isError && classNotOfferedMessage))
  const showEmpty =
    !isFetching &&
    !isError &&
    availability &&
    (availability.status === 'NOT_AVAILABLE' || coaches.length === 0)

  const summaryProps = {
    selectedClass,
    selectedCoach,
    seatCount,
    setSeatCount,
    maxSeats,
    onContinue: continueBooking,
  }

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <SeatSelectionHeader onBack={() => navigate('/home')} />
      <TrainSummary
        train={train}
        journeyDate={journeyDate}
        sourceStation={sourceStation}
        destinationStation={destinationStation}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 pb-28 sm:px-6 lg:flex-row lg:pb-8 lg:px-8">
        <CoachGridSection
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          classCache={classCache}
          isFetching={isFetching}
          availability={availability}
          coaches={coaches}
          showNotOffered={showNotOffered}
          showEmpty={showEmpty}
          isError={isError}
          error={error}
          selectedCoach={selectedCoach}
          setSelectedCoach={setSelectedCoach}
          sourceStation={sourceStation}
          destinationStation={destinationStation}
          journeyDate={journeyDate}
        />
        <TripSummaryAside {...summaryProps} />
      </div>
      <MobileContinueBar {...summaryProps} />
    </main>
  )
}
