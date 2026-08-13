import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import { parseQrInput, verifyTicket } from '../../api/tickets'
import Button from '../../components/ui/Button'

function formatStationName(name = '') {
  return String(name || '')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function emptyManual() {
  return {
    pnr: '',
    ref: '',
    trn: '',
    dt: '',
    cls: '',
    st: 'CNF',
    sig: '',
  }
}

export default function TicketVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const seedPayload = location.state?.qrPayload ?? null

  const [mode, setMode] = useState(seedPayload ? 'paste' : 'paste')
  const [pasteText, setPasteText] = useState(
    seedPayload ? JSON.stringify(seedPayload, null, 2) : '',
  )
  const [manual, setManual] = useState(() => {
    if (!seedPayload) return emptyManual()
    return {
      pnr: seedPayload.pnr || '',
      ref: seedPayload.ref || seedPayload.ticketRef || '',
      trn: seedPayload.trn || seedPayload.trainNo || '',
      dt: seedPayload.dt || seedPayload.journeyDate || '',
      cls: seedPayload.cls || seedPayload.classCode || '',
      st: seedPayload.st || seedPayload.status || 'CNF',
      sig: seedPayload.sig || seedPayload.signature || '',
    }
  })
  const [result, setResult] = useState(null)
  const [failure, setFailure] = useState(null)

  useEffect(() => {
    if (!seedPayload) return
    setPasteText(JSON.stringify(seedPayload, null, 2))
  }, [seedPayload])

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const raw =
        mode === 'paste'
          ? parseQrInput(pasteText)
          : parseQrInput({
              pnr: manual.pnr.trim(),
              ref: manual.ref.trim(),
              trn: manual.trn.trim(),
              dt: manual.dt.trim(),
              cls: manual.cls.trim().toUpperCase(),
              st: manual.st.trim().toUpperCase(),
              sig: manual.sig.trim(),
            })

      if (!raw) {
        throw new Error('Enter or paste a QR payload first')
      }

      return verifyTicket(raw)
    },
    onSuccess: (data) => {
      setFailure(null)
      setResult(data)
      toast.success(data?.message ?? 'Ticket is valid')
    },
    onError: (error) => {
      setResult(null)
      setFailure(error.details ?? { valid: false, message: error.message })
      toast.error(error.message)
    },
  })

  const updateManual = (key, value) => {
    setManual((current) => ({ ...current, [key]: value }))
  }

  const source = result?.journey?.sourceStation
  const destination = result?.journey?.destinationStation

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
                Ticket check
              </span>
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                Verify QR ticket
              </span>
            </span>
          </button>
          <TrachNexaLogo className="h-9 w-9 shrink-0 text-primary-deep sm:h-10 sm:w-10" />
        </div>
      </header>

      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
            Gate / inspector
          </p>
          <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
            Validate an e-ticket
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Paste the QR JSON from a Track Nexa ticket, or enter fields manually. Verification is
            read-only and does not change the booking.
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 pb-28 sm:px-6 sm:py-8">
        <div className="flex gap-2">
          {[
            { id: 'paste', label: 'Paste QR JSON' },
            { id: 'manual', label: 'Manual fields' },
          ].map((item) => {
            const active = mode === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition ${
                  active
                    ? 'bg-charcoal text-white'
                    : 'border-2 border-line bg-white text-slate hover:border-primary-deep'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <section className="rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-5">
          {mode === 'paste' ? (
            <label className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-deep">
                QR payload JSON
              </span>
              <textarea
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                rows={10}
                spellCheck={false}
                placeholder={'{\n  "v": 1,\n  "pnr": "...",\n  "ref": "...",\n  "sig": "..."\n}'}
                className="mt-3 resize-y rounded-2xl border-2 border-line bg-sky-mist px-4 py-3 font-mono text-xs font-semibold text-charcoal outline-none focus:border-primary-deep sm:text-sm"
              />
            </label>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { key: 'pnr', label: 'PNR', placeholder: '10-digit PNR' },
                { key: 'ref', label: 'Ticket ref', placeholder: 'TKT…' },
                { key: 'trn', label: 'Train no', placeholder: '12345' },
                { key: 'dt', label: 'Journey date', placeholder: 'YYYY-MM-DD' },
                { key: 'cls', label: 'Class', placeholder: 'SL / 3A / 2A' },
                { key: 'st', label: 'Status code', placeholder: 'CNF' },
              ].map((field) => (
                <label
                  key={field.key}
                  className="flex flex-col rounded-2xl border-2 border-line bg-sky-mist px-4 py-3"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-deep">
                    {field.label}
                  </span>
                  <input
                    value={manual[field.key]}
                    onChange={(event) => updateManual(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="mt-1 bg-transparent text-sm font-semibold text-charcoal outline-none placeholder:text-slate"
                  />
                </label>
              ))}
              <label className="flex flex-col rounded-2xl border-2 border-line bg-sky-mist px-4 py-3 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-deep">
                  Signature
                </span>
                <textarea
                  value={manual.sig}
                  onChange={(event) => updateManual('sig', event.target.value)}
                  rows={3}
                  spellCheck={false}
                  placeholder="HMAC signature from QR"
                  className="mt-1 resize-none bg-transparent font-mono text-xs font-semibold text-charcoal outline-none placeholder:text-slate"
                />
              </label>
            </div>
          )}

          <p className="mt-4 rounded-2xl bg-sky-mist px-3 py-3 text-xs leading-relaxed text-slate">
            Tip: open a confirmed ticket, tap <span className="font-semibold text-charcoal">Verify QR</span>,
            or copy the QR payload JSON from the ticket API response.
          </p>
        </section>

        {result?.valid ? (
          <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
            <div className="bg-charcoal px-5 py-5 text-white sm:px-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                Verification result
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">Valid ticket</h2>
              <p className="mt-2 text-sm text-white/75">{result.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b-2 border-line p-4 sm:grid-cols-4 sm:p-5">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
                  PNR
                </span>
                <span className="mt-1 font-mono text-sm font-extrabold">{result.pnr}</span>
              </div>
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
            </div>

            <div className="border-b-2 border-line px-4 py-4 sm:px-5">
              <p className="font-heading text-lg font-bold">
                {formatStationName(result.train?.trainName)}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate">
                {source?.code} → {destination?.code} · {result.journey?.journeyDate}
              </p>
              <p className="mt-2 break-all font-mono text-xs text-slate">
                Ref {result.ticketRef}
              </p>
            </div>

            <div className="flex flex-col gap-2 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-deep">
                Seats · {result.passengerCount ?? result.passengers?.length ?? 0}
              </p>
              {(result.passengers ?? []).map((passenger) => (
                <div
                  key={passenger.seq}
                  className="flex items-center justify-between rounded-2xl border-2 border-line bg-sky-mist px-4 py-3"
                >
                  <span className="text-sm font-bold">Passenger {passenger.seq}</span>
                  <span className="rounded-full bg-charcoal px-3 py-1 text-xs font-extrabold text-white">
                    {passenger.allocation?.coachNumber}-{passenger.allocation?.seatNumber}
                    {' · '}
                    {passenger.allocation?.berthType || 'SEAT'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t-2 border-line p-4 sm:flex-row sm:p-5">
              <Button
                className="w-full sm:flex-1"
                onClick={() => navigate(`/booking/pnr/${result.pnr}`)}
              >
                Open booking
              </Button>
              <Button
                variant="ghost"
                className="w-full border-2 border-line sm:flex-1"
                onClick={() => navigate(`/booking/ticket/${result.pnr}`)}
              >
                View ticket
              </Button>
            </div>
          </section>
        ) : null}

        {failure ? (
          <section className="rounded-3xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-5 sm:px-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A3A3A]">
              Not valid
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold text-charcoal">
              Verification failed
            </h2>
            <p className="mt-2 text-sm text-slate">{failure.message}</p>
            {failure.code ? (
              <p className="mt-2 font-mono text-xs font-semibold text-[#8A3A3A]">
                {failure.code}
                {failure.fields?.length ? ` · ${failure.fields.join(', ')}` : ''}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Button
            variant="ghost"
            className="border-2 border-line px-4 py-3"
            onClick={() => {
              setResult(null)
              setFailure(null)
              setPasteText('')
              setManual(emptyManual())
            }}
          >
            Clear
          </Button>
          <Button
            className="flex-1 py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={verifyMutation.isPending}
            onClick={() => verifyMutation.mutate()}
          >
            {verifyMutation.isPending ? 'Verifying…' : 'Verify ticket'}
          </Button>
        </div>
      </div>
    </main>
  )
}
