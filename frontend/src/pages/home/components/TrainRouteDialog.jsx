import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTrainRoute, normalizeRouteStops } from '../../../api/trains'
import Button from '../../../components/ui/Button'
import { RouteStopsSkeleton } from '../../../components/ui/Skeleton'

function formatStationName(name = '') {
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatTime(time = '') {
  if (!time || time === '00:00:00' || time === '-' || time === 'null') return '—'
  const [hours, minutes] = String(time).split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return String(time)

  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

function formatHalt(halt) {
  if (halt == null || halt === '' || halt === '-') return '—'
  if (typeof halt === 'number') return `${halt} min`
  return String(halt)
}

export default function TrainRouteDialog({
  open,
  onClose,
  from,
  to,
  trainNo,
  trainName,
  duration,
  distanceKm,
}) {
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['train-route', from, to, trainNo],
    queryFn: () => getTrainRoute({ from, to, trainNo }),
    enabled: Boolean(open && from && to && trainNo),
    staleTime: 5 * 60_000,
  })

  const stops = normalizeRouteStops(data)

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close route dialog"
        className="absolute inset-0 bg-charcoal/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="train-route-title"
        className="relative z-10 flex max-h-[min(92dvh,920px)] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border-2 border-line bg-white shadow-card sm:rounded-3xl"
      >
        <div className="flex shrink-0 flex-col gap-3 border-b-2 border-line bg-charcoal px-4 py-4 text-white sm:gap-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 flex-col">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                Full journey map
              </p>
              <h2
                id="train-route-title"
                className="mt-1 font-heading text-xl font-bold leading-tight text-white sm:text-2xl"
              >
                {formatStationName(trainName || `Train ${trainNo}`)}
              </h2>
              <p className="mt-1 text-sm font-semibold text-white/75">
                Train No. {trainNo}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-lg font-bold text-white transition hover:bg-white/20"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-charcoal">
              {from} → {to}
            </span>
            {duration ? (
              <span className="rounded-full border border-white/25 px-3 py-1 text-xs font-bold text-white">
                {duration}
              </span>
            ) : null}
            {distanceKm != null ? (
              <span className="rounded-full border border-white/25 px-3 py-1 text-xs font-bold text-white">
                {distanceKm} km
              </span>
            ) : null}
            {!isFetching && stops.length > 0 ? (
              <span className="rounded-full border border-secondary/50 bg-secondary/15 px-3 py-1 text-xs font-bold text-secondary">
                {stops.length} stations
              </span>
            ) : null}
          </div>
        </div>

        <div className="hidden items-center justify-between gap-3 border-b border-line bg-sky-mist px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-deep sm:flex sm:px-6">
          <span className="w-10 text-center">#</span>
          <span className="flex-1">Station</span>
          <span className="w-20 text-right">Arr</span>
          <span className="w-20 text-right">Dep</span>
          <span className="w-14 text-right">Halt</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          {isFetching ? (
            <RouteStopsSkeleton count={7} />
          ) : isError ? (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-8 text-center">
              <p className="text-sm font-bold text-red-700">{error.message}</p>
              <p className="mt-2 text-xs text-red-600">Close and try again in a moment.</p>
            </div>
          ) : stops.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-line bg-sky-mist px-4 py-10 text-center">
              <p className="text-sm font-bold text-charcoal">No stations returned</p>
              <p className="mt-1 text-xs text-slate">This train route has no halt data yet.</p>
            </div>
          ) : (
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
                        isEndpoint
                          ? 'border-charcoal bg-charcoal text-white'
                          : 'border-line bg-white'
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
                          {isFirst ? (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-charcoal">
                              Board
                            </span>
                          ) : null}
                          {isLast ? (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-charcoal">
                              Alight
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
                        <div className="min-w-0 text-left sm:w-20 sm:text-right">
                          <p
                            className={`text-[10px] font-bold uppercase ${
                              isEndpoint ? 'text-white/55' : 'text-slate'
                            }`}
                          >
                            Arr
                          </p>
                          <p
                            className={`text-xs font-extrabold ${
                              isEndpoint ? 'text-white' : 'text-charcoal'
                            }`}
                          >
                            {arrivalLabel}
                          </p>
                        </div>
                        <div className="min-w-0 text-left sm:w-20 sm:text-right">
                          <p
                            className={`text-[10px] font-bold uppercase ${
                              isEndpoint ? 'text-white/55' : 'text-slate'
                            }`}
                          >
                            Dep
                          </p>
                          <p
                            className={`text-xs font-extrabold ${
                              isEndpoint ? 'text-white' : 'text-charcoal'
                            }`}
                          >
                            {departureLabel}
                          </p>
                        </div>
                        <div className="min-w-0 text-left sm:w-14 sm:text-right">
                          <p
                            className={`text-[10px] font-bold uppercase ${
                              isEndpoint ? 'text-white/55' : 'text-slate'
                            }`}
                          >
                            Halt
                          </p>
                          <p
                            className={`text-xs font-extrabold ${
                              isEndpoint ? 'text-white' : 'text-charcoal'
                            }`}
                          >
                            {haltLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t-2 border-line bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <p className="min-w-0 text-xs font-semibold text-slate">
            {isFetching
              ? 'Loading stations…'
              : `${stops.length} station${stops.length === 1 ? '' : 's'} on this stretch`}
          </p>
          <Button className="shrink-0 px-5 py-2.5" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
