import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import Button from '../../components/ui/Button'

const travelClasses = [
  {
    code: 'SL',
    name: 'Sleeper',
    fare: 485,
    capacity: 72,
    available: 42,
    coaches: ['S1', 'S2', 'S3'],
    berthPattern: ['Lower', 'Middle', 'Upper', 'Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper'],
    cabinSize: 6,
  },
  {
    code: '3A',
    name: 'AC 3 Tier',
    fare: 1120,
    capacity: 64,
    available: 18,
    coaches: ['B1', 'B2'],
    berthPattern: ['Lower', 'Middle', 'Upper', 'Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper'],
    cabinSize: 6,
  },
  {
    code: '2A',
    name: 'AC 2 Tier',
    fare: 1640,
    capacity: 46,
    available: 7,
    coaches: ['A1'],
    berthPattern: ['Lower', 'Upper', 'Lower', 'Upper', 'Side Lower', 'Side Upper'],
    cabinSize: 4,
  },
]

const ladiesSeats = new Set([1, 7, 19])

function formatStationName(name = '') {
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatTime(time = '') {
  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
}

function getStoredSelection() {
  try {
    return JSON.parse(sessionStorage.getItem('selectedTrain'))
  } catch {
    return null
  }
}

function SeatIcon({ seat, selected, onSelect }) {
  const coachSeed = seat.coach.charCodeAt(seat.coach.length - 1)
  const unavailable = (seat.number + coachSeed) % 5 === 0 || (seat.number + coachSeed) % 13 === 0
  const ladies = ladiesSeats.has(seat.number) && !unavailable

  const tone = selected
    ? 'border-charcoal bg-charcoal text-white shadow-glow'
    : unavailable
      ? 'cursor-not-allowed border-[#D5E6EC] bg-[#EEF4F7] text-[#A8B8BF]'
      : ladies
        ? 'border-[#F3B4D0] bg-[#FFF0F7] text-[#8A3A62] hover:border-[#E07AA8]'
        : 'border-line bg-[#E8FBFF] text-charcoal hover:border-primary-deep hover:bg-sky-soft'

  return (
    <button
      type="button"
      disabled={unavailable}
      onClick={() => onSelect(seat)}
      aria-label={`Seat ${seat.number}, ${seat.berth}${unavailable ? ', unavailable' : ''}`}
      className={`relative flex h-12 min-w-9 flex-1 flex-col items-center justify-center rounded-lg border-2 transition sm:h-14 sm:min-w-11 sm:rounded-xl ${tone}`}
    >
      <span className="text-xs font-extrabold sm:text-sm">{seat.number}</span>
      <span className="text-[10px] font-bold uppercase tracking-wide">{seat.berth.slice(0, 2)}</span>
      <span
        className={`absolute -right-0.5 top-2 h-5 w-1 rounded-l sm:h-7 ${
          selected ? 'bg-secondary' : unavailable ? 'bg-[#D5E6EC]' : 'bg-current opacity-30'
        }`}
      />
    </button>
  )
}

function CoachMap({ coach, travelClass, selectedSeats, onSelect }) {
  const seats = Array.from({ length: travelClass.capacity }, (_, index) => ({
    id: `${coach}-${index + 1}`,
    coach,
    number: index + 1,
    berth: travelClass.berthPattern[index % travelClass.berthPattern.length],
  }))
  const rowSize = travelClass.berthPattern.length
  const rows = []

  for (let index = 0; index < seats.length; index += rowSize) {
    rows.push(seats.slice(index, index + rowSize))
  }

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-2">
      <div className="flex min-w-[min(100%,420px)] w-max max-w-none flex-col rounded-[22px] border-2 border-line bg-white p-3 sm:min-w-[540px] sm:rounded-[28px] sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-charcoal px-3 py-3 text-white sm:mb-4 sm:px-4">
          <div className="flex min-w-0 flex-col">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              You are inside
            </p>
            <p className="text-base font-bold sm:text-lg">Coach {coach}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[10px] font-semibold text-white/70 sm:text-xs">
            <span>← Entry</span>
            <span className="h-5 w-px bg-white/20" />
            <span>Washroom →</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {rows.map((row, rowIndex) => {
            const cabinSeats = row.slice(0, travelClass.cabinSize)
            const sideSeats = row.slice(travelClass.cabinSize)

            return (
              <div key={`${coach}-row-${rowIndex}`} className="flex items-stretch gap-1.5 sm:gap-2">
                <div className="flex flex-[3] gap-1.5 sm:gap-2">
                  {cabinSeats.map((seat) => (
                    <SeatIcon
                      key={seat.id}
                      seat={seat}
                      selected={selectedSeats.some((selected) => selected.id === seat.id)}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
                <div className="w-4 shrink-0 self-stretch rounded-full bg-sky-mist sm:w-8 sm:bg-white/70" />
                <div className="flex flex-1 gap-1.5 sm:gap-2">
                  {sideSeats.map((seat) => (
                    <SeatIcon
                      key={seat.id}
                      seat={seat}
                      selected={selectedSeats.some((selected) => selected.id === seat.id)}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function SeatSelectionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const selection = location.state ?? getStoredSelection()
  const train = selection?.train
  const [selectedClass, setSelectedClass] = useState(travelClasses[0])
  const [selectedCoach, setSelectedCoach] = useState(travelClasses[0].coaches[0])
  const [selectedSeats, setSelectedSeats] = useState([])

  const total = useMemo(
    () => selectedSeats.length * selectedClass.fare,
    [selectedClass.fare, selectedSeats.length],
  )

  if (!train) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-sky-mist p-4 sm:p-6">
        <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-line bg-white p-6 text-center shadow-card sm:p-8">
          <TrachNexaLogo className="h-16 w-16 text-primary-deep" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-charcoal sm:text-3xl">
            Select a train first
          </h1>
          <p className="mt-2 text-sm text-slate">
            Search a route and choose a train to explore its coaches.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/home')}>
            Back to train search
          </Button>
        </div>
      </main>
    )
  }

  const changeClass = (travelClass) => {
    setSelectedClass(travelClass)
    setSelectedCoach(travelClass.coaches[0])
    setSelectedSeats([])
  }

  const changeCoach = (coach) => {
    setSelectedCoach(coach)
    setSelectedSeats([])
  }

  const toggleSeat = (seat) => {
    setSelectedSeats((current) => {
      const exists = current.some((selected) => selected.id === seat.id)
      if (exists) return current.filter((selected) => selected.id !== seat.id)
      if (current.length >= 6) {
        toast.error('You can select up to 6 seats')
        return current
      }
      return [...current, seat]
    })
  }

  const continueBooking = () => {
    if (selectedSeats.length === 0) {
      toast.error('Select at least one seat to continue')
      return
    }
    toast.success(`${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} reserved`)
  }

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
                Choose your space
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
                  {train.journeyDate}
                </span>
              </div>
              <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                {formatStationName(train.trainName)}
              </h1>
            </div>

            <div className="flex w-full min-w-0 items-center gap-3 sm:gap-4 lg:max-w-xl lg:shrink-0">
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-xl font-black sm:text-2xl">{formatTime(train.from?.departureTime)}</p>
                <p className="mt-1 text-sm font-bold text-secondary">{train.from?.code}</p>
                <p className="truncate text-xs text-white/60">{formatStationName(train.from?.name)}</p>
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
                <p className="mt-1 text-sm font-bold text-secondary">{train.to?.code}</p>
                <p className="truncate text-xs text-white/60">{formatStationName(train.to?.name)}</p>
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
                Demo availability
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {travelClasses.map((travelClass) => {
                const active = selectedClass.code === travelClass.code
                return (
                  <button
                    key={travelClass.code}
                    type="button"
                    onClick={() => changeClass(travelClass)}
                    className={`flex flex-col rounded-2xl border-2 p-4 text-left transition ${
                      active
                        ? 'border-charcoal bg-charcoal text-white shadow-card'
                        : 'border-line bg-white hover:border-primary-deep'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <p className={`text-xs font-bold ${active ? 'text-secondary' : 'text-primary-deep'}`}>
                          {travelClass.code}
                        </p>
                        <p className="mt-1 font-bold">{travelClass.name}</p>
                      </div>
                      {active ? <span className="text-secondary">✓</span> : null}
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-2">
                      <span className={`flex flex-col text-xs font-semibold ${active ? 'text-white' : 'text-slate'}`}>
                        <span>{travelClass.available} available</span>
                        <span className="mt-0.5">
                          {travelClass.capacity} berths / coach
                        </span>
                      </span>
                      <span className="text-lg font-black">₹{travelClass.fare}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="flex flex-col rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-deep">
                  Step 2
                </p>
                <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
                  Walk through the coach
                </h2>
                <p className="mt-1 text-sm text-slate">
                  Choose a coach, then tap the berth that feels right.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedClass.coaches.map((coach) => (
                  <button
                    key={coach}
                    type="button"
                    onClick={() => changeCoach(coach)}
                    className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                      selectedCoach === coach
                        ? 'bg-aqua-gradient text-charcoal shadow-glow'
                        : 'bg-sky-soft text-slate hover:bg-sky'
                    }`}
                  >
                    {coach}
                  </button>
                ))}
              </div>
            </div>

            <div className="my-5 flex flex-wrap gap-3 text-xs font-semibold text-slate sm:gap-4">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded border-2 border-line bg-[#E8FBFF]" /> Available
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-charcoal" /> Selected
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded border border-[#F3B4D0] bg-[#FFF0F7]" /> Ladies
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-[#EEF4F7]" /> Unavailable
              </span>
            </div>

            <CoachMap
              coach={selectedCoach}
              travelClass={selectedClass}
              selectedSeats={selectedSeats}
              onSelect={toggleSeat}
            />
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
                <span className="text-sm text-slate">Class · Coach</span>
                <span className="text-sm font-extrabold text-charcoal">
                  {selectedClass.code} · {selectedCoach}
                </span>
              </div>

              <div className="py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">
                  Selected berths
                </p>
                {selectedSeats.length === 0 ? (
                  <div className="mt-3 rounded-2xl border-2 border-dashed border-line bg-sky-mist p-4 text-center">
                    <p className="text-sm font-semibold text-slate">Your seats will appear here</p>
                    <p className="mt-1 text-xs text-slate">Tap any aqua berth in the coach</p>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedSeats.map((seat) => (
                      <button
                        key={seat.id}
                        type="button"
                        onClick={() => toggleSeat(seat)}
                        className="rounded-xl bg-sky-soft px-3 py-2 text-left text-xs text-charcoal"
                      >
                        <span className="block font-extrabold">{seat.id}</span>
                        <span>{seat.berth} · ×</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t-2 border-line pt-4">
                <div className="flex items-center justify-between text-sm text-slate">
                  <span>Base fare × {selectedSeats.length}</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-sm font-bold text-charcoal">Estimated total</span>
                  <span className="text-3xl font-black text-charcoal">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <Button
                className="mt-5 w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
                onClick={continueBooking}
                disabled={selectedSeats.length === 0}
              >
                Continue with {selectedSeats.length || 0} seat{selectedSeats.length === 1 ? '' : 's'}
              </Button>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-slate">
                No payment yet. Availability is rechecked before booking.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold uppercase tracking-wider text-primary-deep">
              {selectedClass.code} · {selectedCoach}
              {selectedSeats.length > 0 ? ` · ${selectedSeats.length} seat${selectedSeats.length === 1 ? '' : 's'}` : ''}
            </p>
            <p className="text-xl font-black text-charcoal">
              ₹{total.toLocaleString('en-IN')}
            </p>
          </div>
          <Button
            className="shrink-0 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={continueBooking}
            disabled={selectedSeats.length === 0}
          >
            Continue
          </Button>
        </div>
      </div>
    </main>
  )
}
