import { occupancyTone } from './occupancy'

export default function CoachCard({ coach, selected, onSelect }) {
  const available = coach.availableSeats ?? 0
  const total = coach.totalSeats ?? 0
  const booked = coach.bookedSeats ?? 0
  const held = coach.heldSeats ?? 0
  const fill = total ? Math.max(0, Math.min(100, ((total - available) / total) * 100)) : 100
  const disabled = available <= 0

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(coach)}
      className={`flex w-full flex-col rounded-2xl border-2 p-4 text-left transition ${
        selected
          ? 'border-charcoal bg-charcoal text-white shadow-card'
          : disabled
            ? 'cursor-not-allowed border-line bg-[#F3F7F9] text-slate opacity-70'
            : 'border-line bg-white hover:border-primary-deep hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
              selected ? 'text-secondary' : 'text-primary-deep'
            }`}
          >
            Coach
          </p>
          <p className="mt-1 font-heading text-xl font-bold sm:text-2xl">{coach.coachNumber}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-extrabold ${
            selected
              ? 'bg-aqua-gradient text-charcoal'
              : disabled
                ? 'bg-[#E8EEF1] text-slate'
                : 'bg-sky-soft text-primary-deep'
          }`}
        >
          {disabled ? 'Full' : `${available} free`}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
        <div
          className={`h-full rounded-full transition-all ${
            selected ? 'bg-secondary' : occupancyTone(available, total)
          }`}
          style={{ width: `${fill}%` }}
        />
      </div>

      <div
        className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold ${
          selected ? 'text-white/70' : 'text-slate'
        }`}
      >
        <span>{total} seats</span>
        <span>{booked} booked</span>
        <span>{held} held</span>
      </div>
    </button>
  )
}
