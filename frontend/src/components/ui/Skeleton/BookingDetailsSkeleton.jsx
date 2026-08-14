import { Skeleton } from './Skeleton'

export function BookingDetailsSkeleton() {
  return (
    <section
      className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card"
      aria-busy="true"
      aria-label="Loading booking"
    >
      <div className="flex items-start justify-between gap-3 bg-charcoal px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-2.5 w-10 bg-white/20" rounded="md" />
          <Skeleton className="h-8 w-44 bg-white/25" rounded="md" />
          <Skeleton className="h-3 w-36 bg-white/15" rounded="md" />
        </div>
        <Skeleton className="h-6 w-20 bg-white/20" rounded="full" />
      </div>
      <div className="space-y-4 p-5">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" rounded="full" />
          <Skeleton className="h-6 w-12" rounded="full" />
          <Skeleton className="h-6 w-24" rounded="full" />
        </div>
        <Skeleton className="h-6 w-52" rounded="md" />
        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-14" rounded="md" />
            <Skeleton className="h-3 w-28" rounded="md" />
          </div>
          <div className="flex flex-1 flex-col items-end gap-2">
            <Skeleton className="h-5 w-14" rounded="md" />
            <Skeleton className="h-3 w-28" rounded="md" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-2xl border-2 border-line bg-sky-mist px-4 py-3"
            >
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" rounded="md" />
                <Skeleton className="h-3 w-24" rounded="md" />
              </div>
              <Skeleton className="h-7 w-24" rounded="full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
