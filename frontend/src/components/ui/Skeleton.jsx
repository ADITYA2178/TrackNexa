/**
 * Base shimmer block. Use for any placeholder shape.
 * Compose page-specific layouts with the helpers below.
 */
export function Skeleton({ className = '', rounded = 'xl' }) {
  const radii = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  }

  return (
    <div
      aria-hidden="true"
      className={`tn-skeleton ${radii[rounded] ?? radii.xl} ${className}`}
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          rounded="md"
          className={`h-3 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export function SkeletonCircle({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }

  return <Skeleton rounded="full" className={`${sizes[size] ?? sizes.md} ${className}`} />
}

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

export function ClassCardsSkeleton({ count = 4 }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-hidden px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex min-w-[9.5rem] flex-col rounded-2xl border-2 border-line bg-white p-3.5 sm:min-w-0 sm:p-4"
        >
          <Skeleton className="h-3 w-10" rounded="md" />
          <Skeleton className="mt-2 h-4 w-24" rounded="md" />
          <Skeleton className="mt-4 h-4 w-20" rounded="md" />
          <Skeleton className="mt-2 h-3 w-28" rounded="md" />
        </div>
      ))}
    </div>
  )
}

export function TicketSkeleton() {
  return (
    <section
      className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-card"
      aria-busy="true"
      aria-label="Loading ticket"
    >
      <div className="bg-charcoal px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton className="h-2.5 w-32 bg-white/20" rounded="md" />
            <Skeleton className="h-9 w-48 max-w-full bg-white/25" rounded="md" />
            <Skeleton className="h-3 w-40 bg-white/15" rounded="md" />
          </div>
          <Skeleton className="h-28 w-28 bg-white/20 sm:h-32 sm:w-32" rounded="2xl" />
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" rounded="full" />
          <Skeleton className="h-6 w-14" rounded="full" />
          <Skeleton className="h-6 w-24" rounded="full" />
        </div>
        <Skeleton className="h-6 w-56 max-w-full" rounded="md" />
        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-16" rounded="md" />
            <Skeleton className="h-3 w-28" rounded="md" />
          </div>
          <div className="flex flex-1 flex-col items-end gap-2">
            <Skeleton className="h-5 w-16" rounded="md" />
            <Skeleton className="h-3 w-28" rounded="md" />
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-2xl border-2 border-line bg-sky-mist px-4 py-3"
            >
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-36" rounded="md" />
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

export function PageBlockSkeleton({ className = '' }) {
  return (
    <div
      className={`flex flex-col items-stretch rounded-3xl border-2 border-line bg-white p-5 ${className}`}
      aria-busy="true"
    >
      <Skeleton className="h-4 w-28" rounded="md" />
      <Skeleton className="mt-3 h-7 w-56 max-w-full" rounded="md" />
      <SkeletonText lines={3} className="mt-5" />
      <Skeleton className="mt-6 h-11 w-full" rounded="full" />
    </div>
  )
}
