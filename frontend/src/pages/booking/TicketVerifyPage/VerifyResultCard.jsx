import { useNavigate } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import { formatStationName } from '../../../utils/format'

export default function VerifyResultCard({ result }) {
  const navigate = useNavigate()
  const source = result?.journey?.sourceStation
  const destination = result?.journey?.destinationStation

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card">
      <div className="bg-charcoal px-5 py-5 text-white sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
          Verification result
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">Valid ticket</h2>
        <p className="mt-2 text-sm text-white/75">{result.message}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b-2 border-line p-4 sm:grid-cols-4 sm:p-5">
        {[
          { label: 'PNR', value: result.pnr, mono: true },
          { label: 'Status', value: result.status },
          { label: 'Train', value: result.train?.trainNo },
          { label: 'Class', value: result.classCode },
        ].map((item) => (
          <div key={item.label} className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-deep">
              {item.label}
            </span>
            <span
              className={`mt-1 text-sm font-extrabold ${item.mono ? 'font-mono' : ''}`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="border-b-2 border-line px-4 py-4 sm:px-5">
        <p className="font-heading text-lg font-bold">
          {formatStationName(result.train?.trainName)}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate">
          {source?.code} → {destination?.code} · {result.journey?.journeyDate}
        </p>
        <p className="mt-2 break-all font-mono text-xs text-slate">Ref {result.ticketRef}</p>
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
        <Button className="w-full sm:flex-1" onClick={() => navigate(`/booking/pnr/${result.pnr}`)}>
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
  )
}
