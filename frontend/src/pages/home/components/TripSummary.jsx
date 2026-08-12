import Card from '../../../components/ui/Card'
import MiniMap from './MiniMap'

export default function TripSummary() {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-deep">
            Your next trip
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-charcoal">
            NEXA EXPRESS
          </h2>
          <p className="text-sm font-semibold text-slate">Train No. 12345</p>
        </div>
        <span className="rounded-full bg-secondary-muted px-3 py-1 text-xs font-bold uppercase text-primary-deep">
          On Time
        </span>
      </div>

      <div className="mt-6">
        <MiniMap />
      </div>

      <div className="mt-6 flex gap-3">
        <div className="flex flex-1 flex-col rounded-2xl bg-sky-soft p-4">
          <p className="text-xs text-slate">Departure</p>
          <p className="mt-1 text-lg font-bold text-charcoal">12:00 AM</p>
        </div>
        <div className="flex flex-1 flex-col rounded-2xl bg-sky-soft p-4">
          <p className="text-xs text-slate">Platform</p>
          <p className="mt-1 text-lg font-bold text-charcoal">#2</p>
        </div>
      </div>
    </Card>
  )
}
