import { Skeleton } from './Skeleton'

export function CoachGridSkeleton({ count = 4 }) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      aria-busy="true"
      aria-label="Loading coaches"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-2xl border-2 border-line bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-2.5 w-12" rounded="md" />
              <Skeleton className="h-7 w-16" rounded="md" />
            </div>
            <Skeleton className="h-7 w-16" rounded="full" />
          </div>
          <Skeleton className="mt-4 h-2 w-full" rounded="full" />
          <div className="mt-3 flex gap-4">
            <Skeleton className="h-3 w-14" rounded="md" />
            <Skeleton className="h-3 w-16" rounded="md" />
            <Skeleton className="h-3 w-12" rounded="md" />
          </div>
        </div>
      ))}
    </div>
  )
}
