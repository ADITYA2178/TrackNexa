import { Skeleton } from './Skeleton'

export function StationListSkeleton({ count = 5 }) {
  return (
    <ul className="flex flex-col gap-1 py-1" aria-busy="true" aria-label="Loading stations">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-40 max-w-[70%]" rounded="md" />
            <Skeleton className="h-2.5 w-24 max-w-[40%]" rounded="md" />
          </div>
          <Skeleton className="h-6 w-12" rounded="full" />
        </li>
      ))}
    </ul>
  )
}
