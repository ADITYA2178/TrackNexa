import { Skeleton } from './Skeleton'

export function RouteStopsSkeleton({ count = 6 }) {
  return (
    <div className="flex flex-col gap-3 py-2" aria-busy="true" aria-label="Loading route">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-start gap-3">
          <Skeleton className="mt-1 h-8 w-8 shrink-0" rounded="full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border-2 border-line bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-14" rounded="md" />
              <Skeleton className="h-4 w-36 max-w-full" rounded="md" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-3 w-12" rounded="md" />
              <Skeleton className="h-3 w-12" rounded="md" />
              <Skeleton className="h-3 w-10" rounded="md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
