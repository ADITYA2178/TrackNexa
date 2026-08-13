import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import { getSeatAvailability, TRAVEL_CLASSES } from '../../api/availability'
import Button from '../../components/ui/Button'
import { CoachGridSkeleton, Skeleton } from '../../components/ui/Skeleton'

function formatStationName(name = '') {
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatTime(time = '') {
  const [hours, minutes] = String(time).split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time || '--'
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
}

function getStoredSelection() {
  try {
    return JSON.parse(sessionStorage.getItem('selectedTrain'))
  } catch {
    return null
  }
}

function occupancyTone(available, total) {
  if (!total) return 'bg-slate/20'
  const ratio = available / total
  if (ratio > 0.4) return 'bg-secondary'
  if (ratio > 0.15) return 'bg-primary'
  return 'bg-[#E07A7A]'
}

function ClassCard({ travelClass, active, availability, loading, onSelect }) {
  const available = availability?.availableSeats
  const status = availability?.status
  const unavailable = status === 'NOT_AVAILABLE' || available === 0
  const notOffered = availability?.notOffered

  return (
    <button
      type="button"
      onClick={() => onSelect(travelClass)}
      className={`flex min-w-[9.5rem] flex-col rounded-2xl border-2 p-3.5 text-left transition sm:min-w-0 sm:p-4 ${
        active
          ? 'border-charcoal bg-charcoal text-white shadow-card'
          : 'border-line bg-white hover:border-primary-deep'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <p className={`text-xs font-bold ${active ? 'text-secondary' : 'text-primary-deep'}`}>
            {travelClass.code}
          </p>
          <p className="mt-1 truncate text-sm font-bold sm:text-base">{travelClass.name}</p>
        </div>
        {active ? <span className="text-secondary">✓</span> : null}
      </div>

      <div className="mt-3 flex flex-col gap-0.5">
        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className={`h-3.5 w-20 ${active ? 'bg-white/25' : ''}`} rounded="md" />
            <Skeleton className={`h-2.5 w-28 ${active ? 'bg-white/15' : ''}`} rounded="md" />
          </div>
        ) : notOffered ? (
          <span className={`text-xs font-semibold ${active ? 'text-white/60' : 'text-slate'}`}>
            Not on this train
          </span>
        ) : availability ? (
          <>
            <span
              className={`text-sm font-extrabold ${
                unavailable
                  ? active
                    ? 'text-white/70'
                    : 'text-slate'
                  : active
                    ? 'text-secondary'
                    : 'text-charcoal'
              }`}
            >
              {unavailable ? 'Waitlist / full' : `${available} seats`}
            </span>
            <span className={`text-[11px] font-semibold ${active ? 'text-white/55' : 'text-slate'}`}>
              {availability.totalSeats} total · {availability.coaches?.length ?? 0} coaches
            </span>
          </>
        ) : (
          <span className={`text-xs font-semibold ${active ? 'text-white/70' : 'text-slate'}`}>
            Tap to check
          </span>
        )}
      </div>
    </button>
  )
}

function CoachCard({ coach, selected, onSelect }) {
  const available = coach.availableSeats ?? 0
  const total = coach.totalSeats ?? 0
  const booked = coach.bookedSeats ?? 0
  const held = coach.heldSeats ?? 0
  const fill = total ? Math.max(0, Math.min(100, ((total - available) / total) * 100)) : 100
  const disabled = available <= 0

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(coach)}
      className={`flex w-full flex-col rounded-2xl border-2 p-4 text-left transition ${
        selected
          ? 'border-charcoal bg-charcoal text-white shadow-card'
          : disabled
            ? 'cursor-not-allowed border-line bg-[#F3F7F9] text-slate opacity-70'
            : 'border-line bg-white hover:border-primary-deep hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${selected ? 'text-secondary' : 'text-primary-deep'}`}>
            Coach
          </p>
          <p className="mt-1 font-heading text-xl font-bold sm:text-2xl">
            {coach.coachNumber}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-extrabold ${
            selected
              ? 'bg-aqua-gradient text-charcoal'
              : disabled
                ? 'bg-[#E8EEF1] text-slate'
                : 'bg-sky-soft text-primary-deep'
          }`}
        >
          {disabled ? 'Full' : `${available} free`}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
        <div
          className={`h-full rounded-full transition-all ${selected ? 'bg-secondary' : occupancyTone(available, total)}`}
          style={{ width: `${fill}%` }}
        />
      </div>

      <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold ${selected ? 'text-white/70' : 'text-slate'}`}>
        <span>{total} seats</span>
        <span>{booked} booked</span>
        <span>{held} held</span>
      </div>
    </button>
  )
}

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

    setClassCache((current) => ({
      ...current,
      [selectedClass.code]: availability,
    }))
    setSelectedCoach(null)
    setSeatCount(1)
  }, [availability, isSuccess, selectedClass.code])

  useEffect(() => {
    if (!isError) return

    const message = error?.message ?? ''
    const notOffered =
      /not available on train/i.test(message) || /CLASS_NOT_AVAILABLE/i.test(message)

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
    if (seatCount > maxSeats && maxSeats > 0) {
      setSeatCount(maxSeats)
    }
  }, [maxSeats, seatCount])

  if (!train) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-sky-mist p-4 sm:p-6">
        <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-line bg-white p-6 text-center shadow-card sm:p-8">
          <TrachNexaLogo className="h-16 w-16 text-primary-deep" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-charcoal sm:text-3xl">
            Select a train first
          </h1>
          <p className="mt-2 text-sm text-slate">
            Search a route and choose a train to check live seat availability.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/home')}>
            Back to train search
          </Button>
        </div>
      </main>
    )
  }

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
      search: {
        from: sourceStation,
        to: destinationStation,
        date: journeyDate,
      },
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

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
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
                Back to results
              </span>
              <span className="truncate font-heading text-base font-bold text-charcoal sm:text-lg">
                Check availability
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
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex min-w-0 flex-col">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-aqua-gradient px-3 py-1 text-[10px] font-black uppercase tracking-widest text-charcoal">
                  Train {train.trainNo}
                </span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
                  {journeyDate}
                </span>
              </div>
              <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                {formatStationName(train.trainName)}
              </h1>
            </div>

            <div className="flex w-full min-w-0 items-center gap-3 sm:gap-4 lg:max-w-xl lg:shrink-0">
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-xl font-black sm:text-2xl">{formatTime(train.from?.departureTime)}</p>
                <p className="mt-1 text-sm font-bold text-secondary">{sourceStation}</p>
                <p className="truncate text-xs text-white/60">
                  {formatStationName(train.from?.name)}
                </p>
              </div>
              <div className="flex min-w-16 shrink-0 flex-col items-center sm:min-w-24">
                <span className="text-[11px] font-bold text-white/70 sm:text-xs">{train.duration}</span>
                <div className="my-2 flex w-full items-center">
                  <span className="h-2 w-2 rounded-full border border-secondary" />
                  <span className="h-px flex-1 bg-secondary" />
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                </div>
                <span className="text-[10px] font-semibold text-white/50">
                  {train.distanceKm} km
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-end text-right">
                <p className="text-xl font-black sm:text-2xl">{formatTime(train.to?.arrivalTime)}</p>
                <p className="mt-1 text-sm font-bold text-secondary">{destinationStation}</p>
                <p className="truncate text-xs text-white/60">
                  {formatStationName(train.to?.name)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 pb-28 sm:px-6 lg:flex-row lg:pb-8 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <section className="flex flex-col">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-deep">
                  Step 1
                </p>
                <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
                  Pick your travel class
                </h2>
              </div>
              <span className="rounded-full bg-sky-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                Live availability
              </span>
            </div>

            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 xl:grid-cols-4">
              {TRAVEL_CLASSES.map((travelClass) => (
                <ClassCard
                  key={travelClass.code}
                  travelClass={travelClass}
                  active={selectedClass.code === travelClass.code}
                  availability={classCache[travelClass.code]}
                  loading={selectedClass.code === travelClass.code && isFetching}
                  onSelect={setSelectedClass}
                />
              ))}
            </div>
          </section>

          <section className="flex flex-col rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-deep">
                  Step 2
                </p>
                <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
                  Choose a coach
                </h2>
                <p className="mt-1 text-sm text-slate">
                  Availability is for {sourceStation} → {destinationStation} on {journeyDate}.
                </p>
              </div>
              {availability && !showNotOffered ? (
                <div className="rounded-2xl bg-sky-mist px-4 py-2 text-sm font-semibold text-charcoal">
                  <span className="font-extrabold text-primary-deep">
                    {availability.availableSeats ?? 0}
                  </span>{' '}
                  free of {availability.totalSeats ?? 0} in {selectedClass.code}
                </div>
              ) : null}
            </div>

            <div className="mt-5">
              {isFetching ? (
                <CoachGridSkeleton count={4} />
              ) : showNotOffered ? (
                <div className="rounded-2xl border-2 border-line bg-sky-mist px-4 py-10 text-center">
                  <p className="font-heading text-lg font-bold text-charcoal">
                    {selectedClass.code} is not offered on this train
                  </p>
                  <p className="mt-2 text-sm text-slate">Try another travel class above.</p>
                </div>
              ) : isError ? (
                <div className="rounded-2xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-8 text-center">
                  <p className="font-heading text-lg font-bold text-charcoal">Couldn’t load seats</p>
                  <p className="mt-2 text-sm text-slate">{error.message}</p>
                </div>
              ) : showEmpty ? (
                <div className="rounded-2xl border-2 border-line bg-sky-mist px-4 py-10 text-center">
                  <p className="font-heading text-lg font-bold text-charcoal">No seats available</p>
                  <p className="mt-2 text-sm text-slate">
                    {availability?.message || `All ${selectedClass.code} coaches are full for this segment.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {coaches.map((coach) => (
                    <CoachCard
                      key={coach.coachId ?? coach.coachNumber}
                      coach={coach}
                      selected={selectedCoach?.coachNumber === coach.coachNumber}
                      onSelect={setSelectedCoach}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="hidden w-full flex-col lg:flex lg:w-[320px] lg:shrink-0 lg:self-start">
          <div className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
            <div className="bg-charcoal p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                Your journey capsule
              </p>
              <h2 className="mt-1 font-heading text-2xl font-bold text-white">Trip summary</h2>
            </div>
            <div className="flex flex-col p-5">
              <div className="flex items-center justify-between border-b-2 border-line pb-4">
                <span className="text-sm text-slate">Class</span>
                <span className="text-sm font-extrabold text-charcoal">
                  {selectedClass.code} · {selectedClass.name}
                </span>
              </div>

              <div className="border-b-2 border-line py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">
                  Selected coach
                </p>
                {selectedCoach ? (
                  <div className="mt-3 rounded-2xl bg-sky-soft px-4 py-3">
                    <p className="text-lg font-extrabold text-charcoal">{selectedCoach.coachNumber}</p>
                    <p className="mt-1 text-xs font-semibold text-slate">
                      {selectedCoach.availableSeats} seats available
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border-2 border-dashed border-line bg-sky-mist p-4 text-center">
                    <p className="text-sm font-semibold text-slate">Pick a coach with free seats</p>
                  </div>
                )}
              </div>

              <div className="py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">
                  How many seats?
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!selectedCoach || seatCount <= 1}
                    onClick={() => setSeatCount((n) => Math.max(1, n - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-white text-lg font-bold disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-10 text-center text-2xl font-black text-charcoal">
                    {seatCount}
                  </span>
                  <button
                    type="button"
                    disabled={!selectedCoach || seatCount >= maxSeats}
                    onClick={() => setSeatCount((n) => Math.min(maxSeats, n + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-white text-lg font-bold disabled:opacity-40"
                  >
                    +
                  </button>
                  <span className="text-xs font-semibold text-slate">
                    max {maxSeats || 0}
                  </span>
                </div>
              </div>

              <Button
                className="mt-2 w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
                onClick={continueBooking}
                disabled={!selectedCoach || seatCount < 1}
              >
                Continue with {seatCount} seat{seatCount === 1 ? '' : 's'}
              </Button>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-slate">
                Next step: passenger details & seat hold. Availability is rechecked before booking.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold uppercase tracking-wider text-primary-deep">
              {selectedClass.code}
              {selectedCoach ? ` · ${selectedCoach.coachNumber}` : ''}
              {selectedCoach ? ` · ${seatCount} seat${seatCount === 1 ? '' : 's'}` : ''}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                disabled={!selectedCoach || seatCount <= 1}
                onClick={() => setSeatCount((n) => Math.max(1, n - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-sm font-bold disabled:opacity-40"
              >
                −
              </button>
              <span className="text-lg font-black text-charcoal">{seatCount}</span>
              <button
                type="button"
                disabled={!selectedCoach || seatCount >= maxSeats}
                onClick={() => setSeatCount((n) => Math.min(maxSeats, n + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-sm font-bold disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
          <Button
            className="shrink-0 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={continueBooking}
            disabled={!selectedCoach || seatCount < 1}
          >
            Continue
          </Button>
        </div>
      </div>
    </main>
  )
}
