import { Skeleton } from '../../../components/ui/Skeleton'

export default function ClassCard({ travelClass, active, availability, loading, onSelect }) {
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
