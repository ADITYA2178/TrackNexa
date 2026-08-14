import { TRAVEL_CLASSES } from '../../../api/availability'
import { CoachGridSkeleton } from '../../../components/ui/Skeleton'
import ClassCard from './ClassCard'
import CoachCard from './CoachCard'

export default function CoachGridSection({
  selectedClass,
  setSelectedClass,
  classCache,
  isFetching,
  availability,
  coaches,
  showNotOffered,
  showEmpty,
  isError,
  error,
  selectedCoach,
  setSelectedCoach,
  sourceStation,
  destinationStation,
  journeyDate,
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <section className="flex flex-col">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-deep">
              Step 1
            </p>
            <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
              Pick your travel class
            </h2>
          </div>
          <span className="rounded-full bg-sky-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-deep">
            Live availability
          </span>
        </div>

        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 xl:grid-cols-4">
          {TRAVEL_CLASSES.map((travelClass) => (
            <ClassCard
              key={travelClass.code}
              travelClass={travelClass}
              active={selectedClass.code === travelClass.code}
              availability={classCache[travelClass.code]}
              loading={selectedClass.code === travelClass.code && isFetching}
              onSelect={setSelectedClass}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-deep">
              Step 2
            </p>
            <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
              Choose a coach
            </h2>
            <p className="mt-1 text-sm text-slate">
              Availability is for {sourceStation} → {destinationStation} on {journeyDate}.
            </p>
          </div>
          {availability && !showNotOffered ? (
            <div className="rounded-2xl bg-sky-mist px-4 py-2 text-sm font-semibold text-charcoal">
              <span className="font-extrabold text-primary-deep">
                {availability.availableSeats ?? 0}
              </span>{' '}
              free of {availability.totalSeats ?? 0} in {selectedClass.code}
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          {isFetching ? (
            <CoachGridSkeleton count={4} />
          ) : showNotOffered ? (
            <div className="rounded-2xl border-2 border-line bg-sky-mist px-4 py-10 text-center">
              <p className="font-heading text-lg font-bold text-charcoal">
                {selectedClass.code} is not offered on this train
              </p>
              <p className="mt-2 text-sm text-slate">Try another travel class above.</p>
            </div>
          ) : isError ? (
            <div className="rounded-2xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-8 text-center">
              <p className="font-heading text-lg font-bold text-charcoal">Couldn’t load seats</p>
              <p className="mt-2 text-sm text-slate">{error.message}</p>
            </div>
          ) : showEmpty ? (
            <div className="rounded-2xl border-2 border-line bg-sky-mist px-4 py-10 text-center">
              <p className="font-heading text-lg font-bold text-charcoal">No seats available</p>
              <p className="mt-2 text-sm text-slate">
                {availability?.message ||
                  `All ${selectedClass.code} coaches are full for this segment.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {coaches.map((coach) => (
                <CoachCard
                  key={coach.coachId ?? coach.coachNumber}
                  coach={coach}
                  selected={selectedCoach?.coachNumber === coach.coachNumber}
                  onSelect={setSelectedCoach}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
