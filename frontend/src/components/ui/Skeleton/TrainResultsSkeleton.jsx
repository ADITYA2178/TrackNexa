import { Skeleton } from './Skeleton'

export function TrainResultsSkeleton({ count = 3 }) {
  return (
    <section className="mt-5 flex flex-col gap-3" aria-busy="true" aria-label="Loading trains">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-28" rounded="md" />
        <Skeleton className="h-3 w-24" rounded="md" />
      </div>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border-2 border-line bg-white p-3 sm:p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-48 max-w-full" rounded="md" />
              <Skeleton className="h-3 w-28" rounded="md" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9" rounded="full" />
              <Skeleton className="hidden h-9 w-24 sm:block" rounded="full" />
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-20" rounded="md" />
              <Skeleton className="h-3 w-12" rounded="md" />
              <Skeleton className="h-2.5 w-24" rounded="md" />
            </div>
            <div className="flex min-w-16 flex-col items-center gap-2 pt-1 sm:min-w-28">
              <Skeleton className="h-3 w-14" rounded="md" />
              <Skeleton className="h-px w-full" rounded="none" />
              <Skeleton className="h-3 w-12" rounded="md" />
            </div>
            <div className="flex flex-1 flex-col items-end gap-2">
              <Skeleton className="h-5 w-20" rounded="md" />
              <Skeleton className="h-3 w-12" rounded="md" />
              <Skeleton className="h-2.5 w-24" rounded="md" />
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
