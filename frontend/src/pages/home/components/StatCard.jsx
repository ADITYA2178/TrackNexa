export default function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-[#E9DFC0] bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8E722B]">
        {label}
      </p>
      <p className="mt-2 font-heading text-3xl font-bold leading-none text-[#073936]">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate">{detail}</p>
    </div>
  )
}
