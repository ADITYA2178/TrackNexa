import Card from '../../../components/ui/Card'
import MiniMap from './MiniMap'

export default function TripSummary() {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8E722B]">
            Your next trip
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-[#073936]">
            NEXA EXPRESS
          </h2>
          <p className="text-sm font-semibold text-slate">Train No. 12345</p>
        </div>
        <span className="rounded-full bg-[#E7F8EC] px-3 py-1 text-xs font-bold uppercase text-[#245E2E]">
          On Time
        </span>
      </div>

      <div className="mt-6">
        <MiniMap />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#F7F2E5] p-4">
          <p className="text-xs text-slate">Departure</p>
          <p className="mt-1 text-lg font-bold text-[#073936]">12:00 AM</p>
        </div>
        <div className="rounded-2xl bg-[#F7F2E5] p-4">
          <p className="text-xs text-slate">Platform</p>
          <p className="mt-1 text-lg font-bold text-[#073936]">#2</p>
        </div>
      </div>
    </Card>
  )
}
