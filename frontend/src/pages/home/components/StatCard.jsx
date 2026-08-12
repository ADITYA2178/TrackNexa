export default function StatCard({ label, value, detail }) {
  return (
    <div className="flex flex-1 flex-col rounded-2xl border-2 border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-deep">
        {label}
      </p>
      <p className="mt-2 font-heading text-3xl font-bold leading-none text-charcoal">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate">{detail}</p>
    </div>
  )
}
