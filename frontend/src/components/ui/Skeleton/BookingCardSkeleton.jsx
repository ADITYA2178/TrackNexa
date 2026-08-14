import { Skeleton } from './Skeleton'

export function BookingCardSkeleton({ count = 4 }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Loading bookings"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border-2 border-line bg-white">
          <div className="flex items-start justify-between gap-3 border-b-2 border-line px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" rounded="full" />
                <Skeleton className="h-5 w-12" rounded="full" />
              </div>
              <Skeleton className="h-5 w-40" rounded="md" />
              <Skeleton className="h-3 w-28" rounded="md" />
            </div>
            <Skeleton className="h-6 w-20" rounded="full" />
          </div>
          <div className="space-y-4 px-4 py-4 sm:px-5">
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-14" rounded="md" />
                <Skeleton className="h-3 w-24" rounded="md" />
              </div>
              <div className="flex flex-1 flex-col items-end gap-2">
                <Skeleton className="h-5 w-14" rounded="md" />
                <Skeleton className="h-3 w-24" rounded="md" />
              </div>
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" rounded="md" />
              <Skeleton className="h-4 w-16" rounded="md" />
            </div>
          </div>
          <div className="flex gap-2 border-t-2 border-line p-4">
            <Skeleton className="h-10 flex-1" rounded="full" />
            <Skeleton className="h-10 flex-1" rounded="full" />
          </div>
        </div>
      ))}
    </div>
  )
}
