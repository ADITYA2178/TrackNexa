import { formatMoney, formatStationName } from '../../../utils/format'

export default function BookingCancelSummary({ booking, refundPreview, alreadyCancelled }) {
  const source = booking?.journey?.sourceStation
  const destination = booking?.journey?.destinationStation

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-line bg-white shadow-sm">
      <div className="border-b-2 border-line px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-aqua-gradient px-3 py-1 text-[10px] font-black uppercase tracking-widest text-charcoal">
            {booking.train?.trainNo}
          </span>
          <span className="rounded-full border-2 border-line px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-deep">
            {booking.classCode}
          </span>
          <span className="rounded-full border-2 border-line px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate">
            {booking.journey?.journeyDate}
          </span>
        </div>
        <h2 className="mt-3 font-heading text-xl font-bold">
          {formatStationName(booking.train?.trainName)}
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate">
          {source?.code} → {destination?.code} · {formatMoney(booking.fare?.totalFare)}
        </p>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-deep">
          Estimated refund
        </p>
        {refundPreview?.allowed ? (
          <div className="mt-3 rounded-2xl bg-sky-mist px-4 py-4">
            <p className="font-heading text-2xl font-bold text-charcoal">
              {formatMoney(refundPreview.refundAmount)}
              <span className="ml-2 text-base font-semibold text-primary-deep">
                ({refundPreview.refundPercent}%)
              </span>
            </p>
            <p className="mt-1 text-sm text-slate">{refundPreview.label}</p>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-4">
            <p className="font-bold text-charcoal">
              {alreadyCancelled
                ? 'This booking is already cancelled'
                : refundPreview?.label || 'Cancellation not available'}
            </p>
            <p className="mt-1 text-sm text-slate">{booking.statusMessage}</p>
          </div>
        )}
      </div>
    </section>
  )
}
