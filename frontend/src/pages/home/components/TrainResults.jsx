function formatStationName(name = '') {
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatTime(time = '') {
  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time

  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

export default function TrainResults({ result }) {
  const trains = result?.trains ?? []

  return (
    <section className="mt-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#073936]">
          {result.total ?? trains.length} trains found
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8E722B]">
          {result.from} → {result.to}
        </p>
      </div>

      {trains.length === 0 ? (
        <p className="rounded-2xl border border-[#E4D7AD] bg-[#FFFDF8] px-4 py-6 text-sm text-slate">
          No trains found for this route and date.
        </p>
      ) : (
        <ul className="space-y-3">
          {trains.map((train) => (
            <li
              key={`${train.trainNo}-${train.from?.departureTime}`}
              className="rounded-2xl border border-[#E4D7AD] bg-[#FFFDF8] p-4"
            >
              <div>
                <h3 className="font-heading text-xl font-bold text-[#073936]">
                  {formatStationName(train.trainName)}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate">
                  Train No. {train.trainNo}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
                <div>
                  <p className="text-lg font-bold text-[#073936]">
                    {formatTime(train.from?.departureTime)}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#8E722B]">
                    {train.from?.code}
                  </p>
                  <p className="mt-0.5 text-xs text-slate">
                    {formatStationName(train.from?.name)}
                  </p>
                </div>

                <div className="flex min-w-20 flex-col items-center pt-2 sm:min-w-28">
                  <p className="text-xs font-bold text-[#073936]">{train.duration}</p>
                  <div className="mt-1 h-px w-full bg-[#D4AF37]" />
                  <p className="mt-1 text-xs font-semibold text-slate">{train.distanceKm} km</p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-[#073936]">
                    {formatTime(train.to?.arrivalTime)}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#8E722B]">
                    {train.to?.code}
                  </p>
                  <p className="mt-0.5 text-xs text-slate">{formatStationName(train.to?.name)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
