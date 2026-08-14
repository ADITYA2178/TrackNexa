import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatStationName, formatTime } from '../../../utils/format'
import { LineIcon } from './HomeIcons'
import TrainRouteDialog from './TrainRouteDialog'

export default function TrainResults({ result }) {
  const navigate = useNavigate()
  const trains = result?.trains ?? []
  const [routeTrain, setRouteTrain] = useState(null)

  const viewSeats = (train) => {
    const selection = {
      train,
      search: {
        from: result.from,
        to: result.to,
        date: result.date,
      },
    }

    sessionStorage.setItem('selectedTrain', JSON.stringify(selection))
    navigate(`/trains/${train.trainNo}/seats`, { state: selection })
  }

  return (
    <section className="mt-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <p className="text-sm font-semibold text-charcoal">
          {result.total ?? trains.length} trains found
        </p>
        <p className="max-w-full truncate text-xs font-semibold uppercase tracking-[0.16em] text-primary-deep">
          {result.from} → {result.to}
        </p>
      </div>

      {trains.length === 0 ? (
        <p className="rounded-2xl border-2 border-line bg-white px-4 py-6 text-sm text-slate">
          No trains found for this route and date.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {trains.map((train) => (
            <li
              key={`${train.trainNo}-${train.from?.departureTime}`}
              className="group rounded-2xl border-2 border-line bg-white p-3 transition hover:-translate-y-0.5 hover:border-primary-deep hover:shadow-glow sm:p-4"
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1 flex-col">
                  <h3 className="font-heading text-lg font-bold text-charcoal sm:text-xl">
                    {formatStationName(train.trainName)}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate">
                    Train No. {train.trainNo}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRouteTrain(train)}
                    aria-label={`View route for ${train.trainName || train.trainNo}`}
                    title="View route"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-line bg-sky-mist text-primary-deep transition hover:border-primary-deep hover:bg-sky-soft"
                  >
                    <LineIcon type="map" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => viewSeats(train)}
                    className="hidden rounded-full bg-charcoal px-4 py-2 text-xs font-bold text-white transition group-hover:bg-primary-deep sm:inline-flex"
                  >
                    View seats
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 sm:gap-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-base font-bold text-charcoal sm:text-lg">
                    {formatTime(train.from?.departureTime)}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary-deep">
                    {train.from?.code}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate">
                    {formatStationName(train.from?.name)}
                  </p>
                </div>

                <div className="flex min-w-16 shrink-0 flex-col items-center pt-2 sm:min-w-28">
                  <p className="text-[11px] font-bold text-charcoal sm:text-xs">{train.duration}</p>
                  <div className="mt-1 h-px w-full bg-aqua-gradient" />
                  <p className="mt-1 text-[11px] font-semibold text-slate sm:text-xs">
                    {train.distanceKm} km
                  </p>
                </div>

                <div className="flex min-w-0 flex-1 flex-col items-end text-right">
                  <p className="text-base font-bold text-charcoal sm:text-lg">
                    {formatTime(train.to?.arrivalTime)}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary-deep">
                    {train.to?.code}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate">
                    {formatStationName(train.to?.name)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => viewSeats(train)}
                className="mt-4 flex w-full items-center justify-between border-t-2 border-line pt-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-primary-deep sm:hidden"
              >
                Select train
                <span aria-hidden="true">→</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <TrainRouteDialog
        open={Boolean(routeTrain)}
        onClose={() => setRouteTrain(null)}
        from={result.from ?? routeTrain?.from?.code}
        to={result.to ?? routeTrain?.to?.code}
        trainNo={routeTrain?.trainNo}
        trainName={routeTrain?.trainName}
        duration={routeTrain?.duration}
        distanceKm={routeTrain?.distanceKm}
      />
    </section>
  )
}
