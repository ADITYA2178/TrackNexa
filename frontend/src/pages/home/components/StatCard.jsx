export default function StatCard({ label, value, detail }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border-2 border-line bg-white p-3 shadow-sm sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-deep sm:text-xs">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-bold leading-none text-charcoal sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate sm:text-sm">{detail}</p>
    </div>
  )
}
