import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import { downloadTicketPdf, getTicketByPnr } from '../../../api/bookings'
import Button from '../../../components/ui/Button'
import { TicketSkeleton } from '../../../components/ui/Skeleton'
import { resolvePnr } from '../../../utils/pnr'
import MissingPnrState from './MissingPnrState'
import TicketCard from './TicketCard'

export default function TicketPage() {
  const navigate = useNavigate()
  const { pnr: paramPnr } = useParams()
  const pnr = resolvePnr(paramPnr)

  const {
    data: ticket,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ticket', pnr],
    queryFn: () => getTicketByPnr(pnr),
    enabled: Boolean(pnr),
    staleTime: 60_000,
    retry: false,
  })

  const handleDownloadPdf = async () => {
    try {
      const { blob, filename } = await downloadTicketPdf(pnr)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success('Ticket PDF downloaded')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (!pnr) return <MissingPnrState />

  return (
    <main className="flex min-h-dvh flex-col bg-sky-mist text-charcoal">
      <header className="sticky top-0 z-50 border-b-2 border-line bg-white print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-soft text-charcoal">
              ←
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep">
                E-ticket
              </span>
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                PNR {pnr}
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

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 pb-10 sm:px-6 sm:py-8">
        {isFetching && !ticket ? <TicketSkeleton /> : null}

        {isError ? (
          <div className="rounded-3xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-8 text-center sm:px-6">
            <p className="font-heading text-lg font-bold text-charcoal">Couldn’t load ticket</p>
            <p className="mt-2 text-sm text-slate">{error.message}</p>
            <Button className="mt-5" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : null}

        {ticket ? (
          <TicketCard ticket={ticket} pnr={pnr} onDownloadPdf={handleDownloadPdf} />
        ) : null}
      </div>
    </main>
  )
}
