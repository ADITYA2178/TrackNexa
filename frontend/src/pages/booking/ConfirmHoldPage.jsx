import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import {
  confirmSeatHold,
  getStoredActiveHold,
  getStoredAuthUser,
  storeActiveHold,
} from '../../api/bookings'
import { storeConfirmedBooking } from '../../api/payments'
import Button from '../../components/ui/Button'

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

function formatHoldExpiry(heldUntil) {
  if (!heldUntil) return null
  const date = new Date(heldUntil)
  if (Number.isNaN(date.getTime())) return String(heldUntil)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function useHoldCountdown(heldUntil) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!heldUntil) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [heldUntil])

  return useMemo(() => {
    if (!heldUntil) return null
    const end = new Date(heldUntil).getTime()
    if (Number.isNaN(end)) return null
    const remainingMs = Math.max(0, end - now)
    const totalSeconds = Math.floor(remainingMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return {
      expired: remainingMs <= 0,
      label: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    }
  }, [heldUntil, now])
}

export default function ConfirmHoldPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const storedHold = getStoredActiveHold()
  const holdFromState = location.state?.hold
  const holdIdFromQuery = searchParams.get('holdId')

  const [holdIdInput, setHoldIdInput] = useState(
    holdFromState?.holdId || storedHold?.holdId || holdIdFromQuery || '',
  )
  const [acknowledged, setAcknowledged] = useState(false)
  const [result, setResult] = useState(null)

  const hold =
    holdFromState ||
    (storedHold?.holdId && storedHold.holdId === holdIdInput.trim() ? storedHold : null) ||
    (storedHold?.holdId === holdIdInput.trim() ? storedHold : null)

  const activeHold =
    hold && hold.holdId === holdIdInput.trim()
      ? hold
      : holdFromState?.holdId === holdIdInput.trim()
        ? holdFromState
        : storedHold?.holdId === holdIdInput.trim()
          ? storedHold
          : null

  const countdown = useHoldCountdown(activeHold?.heldUntil)

  const confirmMutation = useMutation({
    mutationFn: confirmSeatHold,
    onSuccess: (data) => {
      storeConfirmedBooking({ ticket: data, booking: { pnr: data.pnr, status: data.status } })
      setResult(data)
      toast.success(data?.message ?? 'Booking confirmed')
    },
    onError: (error) => {
      if (error.code === 'ALREADY_CONFIRMED' && error.pnr) {
        toast.error(`Already confirmed · PNR ${error.pnr}`)
        return
      }
      toast.error(error.message)
    },
  })

  const handleConfirm = () => {
    const holdId = holdIdInput.trim()
    if (!holdId) {
      toast.error('Enter a hold ID')
      return
    }
    if (!acknowledged) {
      toast.error('Confirm you understand this skips payment')
      return
    }
    if (countdown?.expired) {
      toast.error('This hold has expired')
      return
    }

    const authUser = getStoredAuthUser()
    confirmMutation.mutate({
      holdId,
      userId: authUser?.id ?? null,
    })
  }

  if (result) {
    const pnr = result.pnr
    const source = result.journey?.sourceStation
    const destination = result.journey?.destinationStation

    return (
      <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
        <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                Hold confirmed
              </span>
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                Booking issued
              </span>
            </div>
            <TrachNexaLogo className="h-9 w-9 shrink-0 text-primary-deep sm:h-10 sm:w-10" />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
          <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
            <div className="bg-charcoal px-5 py-6 text-white sm:px-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                Your PNR
              </p>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-wide sm:text-4xl">
                {pnr}
              </h1>
              <p className="mt-3 text-sm text-white/75">
                {result.message || 'Booking confirmed successfully'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b-2 border-line p-4 sm:grid-cols-4 sm:p-5">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Status
                </span>
                <span className="mt-1 text-sm font-extrabold">{result.status}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Train
                </span>
                <span className="mt-1 text-sm font-extrabold">{result.train?.trainNo}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Class
                </span>
                <span className="mt-1 text-sm font-extrabold">{result.classCode}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  Fare
                </span>
                <span className="mt-1 text-sm font-extrabold">
                  {formatMoney(result.fare?.totalFare ?? result.totalFare)}
                </span>
              </div>
            </div>

            <div className="border-b-2 border-line px-4 py-4 sm:px-5">
              <p className="font-heading text-lg font-bold">
                {formatStationName(result.train?.trainName)}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate">
                {(source?.code ?? source) || '—'} → {(destination?.code ?? destination) || '—'}
                {result.journey?.journeyDate ? ` · ${result.journey.journeyDate}` : ''}
              </p>
            </div>

            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-deep">
                Passengers
              </p>
              {(result.passengers ?? []).map((passenger) => (
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
                    {passenger.allocation?.coachNumber}-{passenger.allocation?.seatNumber}
                    {' · '}
                    {passenger.allocation?.berthType || 'SEAT'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="w-full py-3.5 sm:flex-1"
              onClick={() => navigate(`/booking/ticket/${pnr}`)}
            >
              View ticket
            </Button>
            <Button
              variant="ghost"
              className="w-full border-2 border-line py-3.5 sm:flex-1"
              onClick={() => navigate(`/booking/pnr/${pnr}`)}
            >
              Booking details
            </Button>
            <Button
              variant="ghost"
              className="w-full border-2 border-line py-3.5 sm:flex-1"
              onClick={() => navigate('/home')}
            >
              Home
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const sourceLabel =
    activeHold?.sourceStation?.code ??
    activeHold?.sourceStation?.name ??
    activeHold?.sourceStation
  const destLabel =
    activeHold?.destinationStation?.code ??
    activeHold?.destinationStation?.name ??
    activeHold?.destinationStation

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/booking/hold')}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-soft text-charcoal">
              ←
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                Alternate path
              </span>
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                Confirm hold
              </span>
            </span>
          </button>
          <TrachNexaLogo className="h-9 w-9 shrink-0 text-primary-deep sm:h-10 sm:w-10" />
        </div>
      </header>

      <section className="bg-charcoal text-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-7">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
              Confirm without payment
            </p>
            <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
              Issue PNR from hold
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Uses <span className="font-semibold text-white">/api/bookings/confirm</span>. Prefer
              the payment flow in production; this is for demo / offline confirmation.
            </p>
          </div>
          {countdown ? (
            <div
              className={`rounded-2xl px-4 py-3 text-center ${
                countdown.expired ? 'bg-[#E07A7A] text-white' : 'bg-aqua-gradient text-charcoal'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]">
                {countdown.expired ? 'Hold expired' : 'Hold expires in'}
              </p>
              <p className="mt-1 font-heading text-2xl font-black tabular-nums">{countdown.label}</p>
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 pb-28 sm:px-6 sm:py-8">
        <section className="rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-5">
          <label className="flex flex-col rounded-2xl border-2 border-line bg-sky-mist px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-deep">
              Hold ID
            </span>
            <input
              value={holdIdInput}
              onChange={(event) => setHoldIdInput(event.target.value)}
              placeholder="HLD-…"
              className="mt-1 bg-transparent font-mono text-sm font-bold text-charcoal outline-none placeholder:font-semibold placeholder:text-slate"
            />
          </label>

          {activeHold ? (
            <div className="mt-4 rounded-2xl border-2 border-line bg-sky-mist px-4 py-4">
              <p className="font-heading text-lg font-bold">
                Train {activeHold.trainId} · {activeHold.classCode}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate">
                {sourceLabel} → {destLabel}
                {activeHold.journeyDate ? ` · ${activeHold.journeyDate}` : ''}
              </p>
              <p className="mt-2 text-sm font-extrabold text-charcoal">
                {formatMoney(activeHold.fare?.totalFare)} ·{' '}
                {activeHold.passengers?.length ?? activeHold.fare?.passengerCount ?? 0} passenger
                {(activeHold.passengers?.length ?? activeHold.fare?.passengerCount ?? 0) === 1
                  ? ''
                  : 's'}
              </p>
              {activeHold.heldUntil ? (
                <p className="mt-2 text-xs font-semibold text-slate">
                  Held until {formatHoldExpiry(activeHold.heldUntil)}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate">
              No matching hold summary in this session. You can still confirm if you have a valid
              hold ID.
            </p>
          )}

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-line bg-[#FFF6E8] px-4 py-3">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#042A3A]"
            />
            <span className="text-sm font-semibold text-slate">
              I understand this confirms the booking and issues a PNR without collecting payment.
            </span>
          </label>
        </section>

        {activeHold?.passengers?.length ? (
          <section className="rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-deep">
              Held passengers
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {activeHold.passengers.map((passenger) => (
                <div
                  key={`${passenger.seq}-${passenger.fullName}`}
                  className="flex flex-col gap-2 rounded-2xl border-2 border-line bg-sky-mist px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="truncate font-bold">
                    {passenger.seq}. {formatStationName(passenger.fullName)}
                  </p>
                  <span className="shrink-0 rounded-full bg-charcoal px-3 py-1 text-xs font-extrabold text-white">
                    {passenger.allocation?.coachNumber}-{passenger.allocation?.seatNumber}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row">
          <Button
            variant="ghost"
            className="w-full border-2 border-line py-3.5 sm:flex-1"
            onClick={() =>
              navigate('/booking/payment', {
                state: { hold: activeHold || { holdId: holdIdInput.trim() } },
              })
            }
          >
            Pay instead
          </Button>
          <Button
            className="w-full py-3.5 sm:flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!holdIdInput.trim() || !acknowledged || confirmMutation.isPending || countdown?.expired}
            onClick={handleConfirm}
          >
            {confirmMutation.isPending ? 'Confirming…' : 'Confirm hold & get PNR'}
          </Button>
        </div>
      </div>
    </main>
  )
}

// Keep store helper import used for potential future draft sync
void storeActiveHold
