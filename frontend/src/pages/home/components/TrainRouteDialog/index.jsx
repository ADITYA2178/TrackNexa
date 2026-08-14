import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTrainRoute, normalizeRouteStops } from '../../../../api/trains'
import Button from '../../../../components/ui/Button'
import RouteDialogHeader from './RouteDialogHeader'
import RouteStopsList from './RouteStopsList'

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
        <RouteDialogHeader
          trainNo={trainNo}
          trainName={trainName}
          from={from}
          to={to}
          duration={duration}
          distanceKm={distanceKm}
          stopsCount={stops.length}
          isFetching={isFetching}
          onClose={onClose}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          <RouteStopsList
            stops={stops}
            isFetching={isFetching}
            isError={isError}
            error={error}
          />
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
