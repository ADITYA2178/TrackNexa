import Button from '../../../components/ui/Button'
import { PaymentOrderSkeleton } from '../../../components/ui/Skeleton'

export default function OrderCreatingView({
  isCreating,
  createFailed,
  errorMessage,
  retrying,
  onRetry,
}) {
  if (isCreating) {
    return <PaymentOrderSkeleton />
  }

  if (createFailed) {
    return (
      <div className="rounded-2xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-8 text-center">
        <p className="font-heading text-lg font-bold text-charcoal">Couldn’t create order</p>
        <p className="mt-2 text-sm text-slate">{errorMessage}</p>
        <Button className="mt-5" onClick={onRetry} disabled={retrying}>
          {retrying ? 'Retrying…' : 'Try again'}
        </Button>
      </div>
    )
  }

  return null
}
