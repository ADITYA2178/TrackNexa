import { Skeleton } from './Skeleton'

export function PaymentOrderSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5" aria-busy="true" aria-label="Creating payment order">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-4 py-2">
          <Skeleton className="h-3 w-24" rounded="md" />
          <Skeleton className={`h-3 ${index < 3 ? 'w-40' : 'w-20'}`} rounded="md" />
        </div>
      ))}
    </div>
  )
}
