import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import { parseQrInput, verifyTicket } from '../../../api/tickets'
import Button from '../../../components/ui/Button'
import ManualPayloadForm from './ManualPayloadForm'
import PastePayloadForm from './PastePayloadForm'
import VerifyFailureCard from './VerifyFailureCard'
import VerifyResultCard from './VerifyResultCard'
import { emptyManual, manualFromPayload } from './manualModel'

export default function TicketVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const seedPayload = location.state?.qrPayload ?? null

  const [mode, setMode] = useState('paste')
  const [pasteText, setPasteText] = useState(
    seedPayload ? JSON.stringify(seedPayload, null, 2) : '',
  )
  const [manual, setManual] = useState(() => manualFromPayload(seedPayload))
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

      if (!raw) throw new Error('Enter or paste a QR payload first')
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
            <PastePayloadForm pasteText={pasteText} onChange={setPasteText} />
          ) : (
            <ManualPayloadForm manual={manual} onUpdate={updateManual} />
          )}
          <p className="mt-4 rounded-2xl bg-sky-mist px-3 py-3 text-xs leading-relaxed text-slate">
            Tip: open a confirmed ticket, tap{' '}
            <span className="font-semibold text-charcoal">Verify QR</span>, or copy the QR payload
            JSON from the ticket API response.
          </p>
        </section>

        {result?.valid ? <VerifyResultCard result={result} /> : null}
        {failure ? <VerifyFailureCard failure={failure} /> : null}
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
