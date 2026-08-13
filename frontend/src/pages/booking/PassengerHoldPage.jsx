import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import {
  BERTH_PREFERENCES,
  createSeatHold,
  GENDER_OPTIONS,
  getStoredAuthUser,
  getStoredHoldDraft,
  storeActiveHold,
} from '../../api/bookings'
import Button from '../../components/ui/Button'

function formatStationName(name = '') {
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatTime(time = '') {
  const [hours, minutes] = String(time).split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time || '--'
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
}

function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function formatHoldExpiry(heldUntil) {
  if (!heldUntil) return null
  const date = new Date(heldUntil)
  if (Number.isNaN(date.getTime())) return String(heldUntil)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function emptyPassenger() {
  return {
    fullName: '',
    age: '',
    gender: 'MALE',
    berthPreference: 'ANY',
  }
}

function FieldShell({ label, children }) {
  return (
    <label className="flex flex-col rounded-2xl border-2 border-line bg-white px-3 py-2.5 sm:px-4 sm:py-3">
      <span className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-deep">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputClassName =
  'w-full bg-transparent text-sm font-semibold text-charcoal outline-none placeholder:font-medium placeholder:text-slate sm:text-base'

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
    setPassengers((current) =>
      current.map((passenger, i) =>
        i === index ? { ...passenger, [key]: value } : passenger,
      ),
    )
  }

  const validate = () => {
    for (let i = 0; i < passengers.length; i += 1) {
      const passenger = passengers[i]
      const name = passenger.fullName.trim()
      const age = Number(passenger.age)

      if (!name) {
        toast.error(`Passenger ${i + 1}: enter full name`)
        return false
      }
      if (!Number.isInteger(age) || age <= 0 || age >= 130) {
        toast.error(`Passenger ${i + 1}: enter a valid age`)
        return false
      }
      if (!passenger.gender) {
        toast.error(`Passenger ${i + 1}: select gender`)
        return false
      }
    }
    return true
  }

  const handleHold = () => {
    if (!train || !availability) {
      toast.error('Missing trip details. Pick seats again.')
      return
    }
    if (!validate()) return

    const authUser = getStoredAuthUser()

    holdMutation.mutate({
      trainId: train.trainNo,
      journeyDate,
      sourceStation,
      destinationStation,
      classCode: availability.classCode,
      userId: authUser?.id ?? null,
      passengers: passengers.map((passenger) => ({
        fullName: passenger.fullName.trim(),
        age: Number(passenger.age),
        gender: passenger.gender,
        berthPreference: passenger.berthPreference || 'ANY',
      })),
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
    return (
      <main className="flex min-h-dvh items-center justify-center bg-sky-mist p-4 sm:p-6">
        <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-line bg-white p-6 text-center shadow-card sm:p-8">
          <TrachNexaLogo className="h-16 w-16 text-primary-deep" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-charcoal sm:text-3xl">
            No seats selected
          </h1>
          <p className="mt-2 text-sm text-slate">
            Choose a class and coach first, then add passenger details to hold seats.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/home')}>
            Back to train search
          </Button>
        </div>
      </main>
    )
  }

  if (holdResult) {
    return (
      <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
        <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                Hold confirmed
              </span>
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                Seats reserved
              </span>
            </div>
            <TrachNexaLogo className="h-9 w-9 shrink-0 text-primary-deep sm:h-10 sm:w-10" />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
          <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
            <div className="bg-charcoal px-5 py-5 text-white sm:px-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                Hold ID
              </p>
              <h1 className="mt-1 break-all font-heading text-2xl font-bold sm:text-3xl">
                {holdResult.holdId}
              </h1>
              <p className="mt-3 text-sm text-white/75">
                Expires around {formatHoldExpiry(holdResult.heldUntil) ?? `${holdResult.holdExpiresInMinutes ?? 10} min`}
                {' · '}
                Complete payment before the hold lapses.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b-2 border-line p-4 sm:grid-cols-4 sm:p-5">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Train
                </span>
                <span className="mt-1 text-sm font-extrabold">{holdResult.trainId}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Class
                </span>
                <span className="mt-1 text-sm font-extrabold">{holdResult.classCode}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Date
                </span>
                <span className="mt-1 text-sm font-extrabold">{holdResult.journeyDate}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Fare
                </span>
                <span className="mt-1 text-sm font-extrabold">
                  {formatMoney(holdResult.fare?.totalFare)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-deep">
                Allocated berths
              </p>
              {(holdResult.passengers ?? []).map((passenger) => (
                <div
                  key={`${passenger.seq}-${passenger.fullName}`}
                  className="flex flex-col gap-2 rounded-2xl border-2 border-line bg-sky-mist px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-charcoal">
                      {passenger.seq}. {passenger.fullName}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate">
                      Age {passenger.age} · {passenger.gender}
                      {passenger.preferenceMatched ? ' · Pref matched' : ''}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-full bg-charcoal px-3 py-1.5 text-xs font-extrabold text-white">
                    {passenger.allocation?.coachNumber}-{passenger.allocation?.seatNumber}
                    {' · '}
                    {passenger.allocation?.berthType || 'SEAT'}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="w-full py-3.5 sm:flex-1"
              onClick={() => toast('Payment comes next — API #3')}
            >
              Continue to payment
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

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              navigate(`/trains/${train.trainNo}/seats`, {
                state: { train, search },
              })
            }
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-soft text-charcoal">
              ←
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                Back to seats
              </span>
              <span className="truncate font-heading text-base font-bold text-charcoal sm:text-lg">
                Passenger details
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
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-aqua-gradient px-3 py-1 text-[10px] font-black uppercase tracking-widest text-charcoal">
                  Train {train.trainNo}
                </span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
                  {summaryBits.classCode} · {seatCount} seat{seatCount === 1 ? '' : 's'}
                </span>
              </div>
              <h1 className="font-heading text-2xl font-bold sm:text-3xl">
                {formatStationName(train.trainName)}
              </h1>
              <p className="mt-1 text-sm text-white/70">
                {sourceStation} → {destinationStation} · {journeyDate}
                {summaryBits.preferredCoach
                  ? ` · Preferred ${summaryBits.preferredCoach}`
                  : ''}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Depart
                </span>
                <span className="font-extrabold">{formatTime(train.from?.departureTime)}</span>
              </div>
              <span className="h-px w-8 bg-secondary/60" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Arrive
                </span>
                <span className="font-extrabold">{formatTime(train.to?.arrivalTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 pb-28 sm:px-6 lg:flex-row lg:pb-8 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-deep">
                Step 3
              </p>
              <h2 className="font-heading text-xl font-bold sm:text-2xl">
                Who’s traveling?
              </h2>
              <p className="mt-1 text-sm text-slate">
                Fill details for {seatCount} passenger{seatCount === 1 ? '' : 's'}. Seats are
                auto-allocated on hold.
              </p>
            </div>
          </div>

          {passengers.map((passenger, index) => (
            <section
              key={`passenger-${index}`}
              className="rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-heading text-lg font-bold text-charcoal">
                  Passenger {index + 1}
                </h3>
                <span className="rounded-full bg-sky-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Required
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldShell label="Full name">
                    <input
                      value={passenger.fullName}
                      onChange={(event) =>
                        updatePassenger(index, 'fullName', event.target.value)
                      }
                      placeholder="As on ID proof"
                      className={inputClassName}
                      autoComplete="name"
                    />
                  </FieldShell>
                </div>

                <FieldShell label="Age">
                  <input
                    type="number"
                    min={1}
                    max={129}
                    inputMode="numeric"
                    value={passenger.age}
                    onChange={(event) => updatePassenger(index, 'age', event.target.value)}
                    placeholder="Years"
                    className={inputClassName}
                  />
                </FieldShell>

                <FieldShell label="Gender">
                  <select
                    value={passenger.gender}
                    onChange={(event) => updatePassenger(index, 'gender', event.target.value)}
                    className={inputClassName}
                  >
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FieldShell>

                <div className="sm:col-span-2">
                  <FieldShell label="Berth preference">
                    <select
                      value={passenger.berthPreference}
                      onChange={(event) =>
                        updatePassenger(index, 'berthPreference', event.target.value)
                      }
                      className={inputClassName}
                    >
                      {BERTH_PREFERENCES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FieldShell>
                </div>
              </div>
            </section>
          ))}
        </div>

        <aside className="hidden w-full flex-col lg:flex lg:w-[320px] lg:shrink-0 lg:self-start">
          <div className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
            <div className="bg-charcoal p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                Ready to hold
              </p>
              <h2 className="mt-1 font-heading text-2xl font-bold">Seat hold</h2>
            </div>
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate">Class</span>
                <span className="font-extrabold">{summaryBits.classCode}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate">Passengers</span>
                <span className="font-extrabold">{seatCount}</span>
              </div>
              {summaryBits.preferredCoach ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate">Preferred coach</span>
                  <span className="font-extrabold">{summaryBits.preferredCoach}</span>
                </div>
              ) : null}
              <p className="rounded-2xl bg-sky-mist px-3 py-3 text-xs leading-relaxed text-slate">
                Holding locks seats for about 10 minutes. Fare is calculated when the hold is
                created.
              </p>
              <Button
                className="w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleHold}
                disabled={holdMutation.isPending}
              >
                {holdMutation.isPending ? 'Holding seats…' : 'Hold seats'}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold uppercase tracking-wider text-primary-deep">
              {summaryBits.classCode} · {seatCount} passenger{seatCount === 1 ? '' : 's'}
            </p>
            <p className="truncate text-sm font-semibold text-slate">
              {sourceStation} → {destinationStation}
            </p>
          </div>
          <Button
            className="shrink-0 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleHold}
            disabled={holdMutation.isPending}
          >
            {holdMutation.isPending ? 'Holding…' : 'Hold seats'}
          </Button>
        </div>
      </div>
    </main>
  )
}
