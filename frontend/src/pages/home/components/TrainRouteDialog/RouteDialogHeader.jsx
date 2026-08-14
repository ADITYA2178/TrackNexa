import { formatStationName } from '../../../../utils/format'

export default function RouteDialogHeader({
  trainNo,
  trainName,
  from,
  to,
  duration,
  distanceKm,
  stopsCount,
  isFetching,
  onClose,
}) {
  return (
    <>
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
            <p className="mt-1 text-sm font-semibold text-white/75">Train No. {trainNo}</p>
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
          {!isFetching && stopsCount > 0 ? (
            <span className="rounded-full border border-secondary/50 bg-secondary/15 px-3 py-1 text-xs font-bold text-secondary">
              {stopsCount} stations
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
    </>
  )
}
