import { RouteStopsSkeleton } from '../../../../components/ui/Skeleton'
import { formatHalt, formatStationName, formatTime } from '../../../../utils/format'

export default function RouteStopsList({ stops, isFetching, isError, error }) {
  if (isFetching) return <RouteStopsSkeleton count={7} />

  if (isError) {
    return (
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-8 text-center">
        <p className="text-sm font-bold text-red-700">{error.message}</p>
        <p className="mt-2 text-xs text-red-600">Close and try again in a moment.</p>
      </div>
    )
  }

  if (stops.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-line bg-sky-mist px-4 py-10 text-center">
        <p className="text-sm font-bold text-charcoal">No stations returned</p>
        <p className="mt-1 text-xs text-slate">This train route has no halt data yet.</p>
      </div>
    )
  }

  return (
    <ol className="relative flex flex-col">
      <span className="absolute bottom-4 left-[1.15rem] top-4 w-0.5 bg-line sm:left-[1.45rem]" />

      {stops.map((stop, index) => {
        const isFirst = index === 0
        const isLast = index === stops.length - 1
        const isEndpoint = isFirst || isLast
        const arrivalLabel = isFirst ? 'Origin' : formatTime(stop.arrivalTime)
        const departureLabel = isLast ? 'End' : formatTime(stop.departureTime)
        const haltLabel = isEndpoint ? '—' : formatHalt(stop.haltMinutes)

        return (
          <li
            key={`${stop.code}-${stop.seq}-${index}`}
            className="relative flex items-start gap-2.5 py-2.5 sm:gap-3 sm:py-3"
          >
            <div className="relative z-10 flex w-8 shrink-0 flex-col items-center sm:w-10">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-black sm:h-8 sm:w-8 ${
                  isEndpoint
                    ? 'border-charcoal bg-charcoal text-white'
                    : 'border-line bg-white text-primary-deep'
                }`}
              >
                {stop.seq || index + 1}
              </span>
            </div>

            <div
              className={`flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border-2 px-3 py-3 sm:flex-row sm:items-start sm:justify-between ${
                isEndpoint ? 'border-charcoal bg-charcoal text-white' : 'border-line bg-white'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-sm font-extrabold uppercase tracking-wide ${
                      isEndpoint ? 'text-secondary' : 'text-primary-deep'
                    }`}
                  >
                    {stop.code || '—'}
                  </p>
                  {isFirst || isLast ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-charcoal">
                      {isFirst ? 'Board' : 'Alight'}
                    </span>
                  ) : null}
                </div>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    isEndpoint ? 'text-white' : 'text-charcoal'
                  }`}
                >
                  {formatStationName(stop.name) || 'Unknown station'}
                </p>
                {stop.distanceKm != null ? (
                  <p
                    className={`mt-1 text-[11px] font-semibold ${
                      isEndpoint ? 'text-white/70' : 'text-slate'
                    }`}
                  >
                    {stop.distanceKm} km from origin
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-current/10 pt-3 sm:flex sm:shrink-0 sm:items-start sm:gap-3 sm:border-0 sm:pt-0">
                {[
                  { label: 'Arr', value: arrivalLabel, width: 'sm:w-20' },
                  { label: 'Dep', value: departureLabel, width: 'sm:w-20' },
                  { label: 'Halt', value: haltLabel, width: 'sm:w-14' },
                ].map((col) => (
                  <div key={col.label} className={`min-w-0 text-left sm:text-right ${col.width}`}>
                    <p
                      className={`text-[10px] font-bold uppercase ${
                        isEndpoint ? 'text-white/55' : 'text-slate'
                      }`}
                    >
                      {col.label}
                    </p>
                    <p
                      className={`text-xs font-extrabold ${
                        isEndpoint ? 'text-white' : 'text-charcoal'
                      }`}
                    >
                      {col.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
