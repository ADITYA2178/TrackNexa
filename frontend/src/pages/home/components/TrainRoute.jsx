import { useQuery } from '@tanstack/react-query'
import { getTrainRoute, normalizeRouteStops } from '../../../api/trains'

function formatStationName(name = '') {
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatTime(time = '') {
  if (!time || time === '00:00:00' || time === '-') return '—'
  const [hours, minutes] = String(time).split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time

  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

export default function TrainRoute({ from, to, trainNo }) {
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['train-route', from, to, trainNo],
    queryFn: () => getTrainRoute({ from, to, trainNo }),
    enabled: Boolean(from && to && trainNo),
    staleTime: 5 * 60_000,
  })

  const stops = normalizeRouteStops(data)

  if (isFetching) {
    return (
      <p className="mt-4 border-t-2 border-line pt-3 text-xs font-semibold text-slate">
        Loading route...
      </p>
    )
  }

  if (isError) {
    return (
      <p className="mt-4 border-t-2 border-line pt-3 text-xs font-semibold text-red-600">
        {error.message}
      </p>
    )
  }

  if (stops.length === 0) {
    return (
      <p className="mt-4 border-t-2 border-line pt-3 text-xs font-semibold text-slate">
        No route stops found for this train.
      </p>
    )
  }

  return (
    <div className="mt-4 border-t-2 border-line pt-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-deep">
          Route between stations
        </p>
        <p className="text-xs font-semibold text-slate">{stops.length} stops</p>
      </div>

      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-max items-start">
          {stops.map((stop, index) => {
            const isFirst = index === 0
            const isLast = index === stops.length - 1
            const time = isLast
              ? formatTime(stop.arrivalTime || stop.departureTime)
              : formatTime(stop.departureTime || stop.arrivalTime)

            return (
              <li key={`${stop.code}-${stop.seq}-${index}`} className="flex items-start">
                <div className="flex w-24 flex-col items-center text-center">
                  <span
                    className={`flex h-3 w-3 rounded-full border-2 ${
                      isFirst || isLast
                        ? 'border-charcoal bg-charcoal'
                        : 'border-line bg-white'
                    }`}
                  />
                  <p className="mt-2 text-xs font-extrabold uppercase tracking-wide text-charcoal">
                    {stop.code}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold text-slate">
                    {formatStationName(stop.name)}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-primary-deep">{time}</p>
                </div>

                {index < stops.length - 1 ? (
                  <div className="mt-1.5 h-0.5 w-8 shrink-0 bg-line" />
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
