import { CANCEL_REASONS } from '../../../api/bookings'
import Button from '../../../components/ui/Button'
import { formatMoney } from '../../../utils/format'

export default function CancelForm({
  reason,
  onReasonChange,
  customReason,
  onCustomReasonChange,
  confirmed,
  onConfirmedChange,
  refundPreview,
  pnr,
  cancelling,
  onCancel,
}) {
  return (
    <>
      <section className="rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-deep">
          Reason
        </p>
        <h2 className="mt-1 font-heading text-xl font-bold">Why are you cancelling?</h2>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CANCEL_REASONS.map((item) => {
            const active = reason === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onReasonChange(item.value)}
                className={`rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? 'border-charcoal bg-charcoal text-white'
                    : 'border-line bg-white hover:border-primary-deep'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {reason === 'OTHER' ? (
          <label className="mt-4 flex flex-col rounded-2xl border-2 border-line bg-sky-mist px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-deep">
              Tell us more
            </span>
            <textarea
              value={customReason}
              onChange={(event) => onCustomReasonChange(event.target.value.slice(0, 500))}
              rows={3}
              placeholder="Brief reason for cancellation"
              className="mt-2 resize-none bg-transparent text-sm font-semibold text-charcoal outline-none placeholder:font-medium placeholder:text-slate"
            />
          </label>
        ) : null}

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-line bg-sky-mist px-4 py-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmedChange(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#042A3A]"
          />
          <span className="text-sm font-semibold text-slate">
            I understand seats will be released and refund follows the policy above.
          </span>
        </label>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">
              Est. refund {formatMoney(refundPreview?.refundAmount)}
            </p>
            <p className="truncate text-sm font-semibold text-slate">PNR {pnr}</p>
          </div>
          <Button
            className="w-full bg-[#8A3A3A] py-3.5 text-white hover:bg-[#6B2B2B] sm:w-auto sm:px-8 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!confirmed || cancelling}
            onClick={onCancel}
          >
            {cancelling ? 'Cancelling…' : 'Confirm cancellation'}
          </Button>
        </div>
      </div>
    </>
  )
}
