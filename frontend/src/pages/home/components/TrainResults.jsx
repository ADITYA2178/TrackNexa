import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()
  const trains = result?.trains ?? []

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
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-charcoal">
          {result.total ?? trains.length} trains found
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-deep">
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
              className="group rounded-2xl border-2 border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary-deep hover:shadow-glow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col">
                  <h3 className="font-heading text-xl font-bold text-charcoal">
                    {formatStationName(train.trainName)}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate">
                    Train No. {train.trainNo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => viewSeats(train)}
                  className="hidden shrink-0 rounded-full bg-charcoal px-4 py-2 text-xs font-bold text-white transition group-hover:bg-primary-deep sm:inline-flex"
                >
                  View seats
                </button>
              </div>

              <div className="mt-4 flex items-start gap-3">
                <div className="flex flex-1 flex-col">
                  <p className="text-lg font-bold text-charcoal">
                    {formatTime(train.from?.departureTime)}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary-deep">
                    {train.from?.code}
                  </p>
                  <p className="mt-0.5 text-xs text-slate">
                    {formatStationName(train.from?.name)}
                  </p>
                </div>

                <div className="flex min-w-20 flex-col items-center pt-2 sm:min-w-28">
                  <p className="text-xs font-bold text-charcoal">{train.duration}</p>
                  <div className="mt-1 h-px w-full bg-aqua-gradient" />
                  <p className="mt-1 text-xs font-semibold text-slate">{train.distanceKm} km</p>
                </div>

                <div className="flex flex-1 flex-col items-end text-right">
                  <p className="text-lg font-bold text-charcoal">
                    {formatTime(train.to?.arrivalTime)}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary-deep">
                    {train.to?.code}
                  </p>
                  <p className="mt-0.5 text-xs text-slate">{formatStationName(train.to?.name)}</p>
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
    </section>
  )
}
