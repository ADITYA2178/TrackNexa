export default function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-3 last:border-b-0">
      <span className="shrink-0 text-sm text-slate">{label}</span>
      <span
        className={`min-w-0 text-right text-sm font-extrabold text-charcoal ${
          mono ? 'break-all font-mono text-xs sm:text-sm' : ''
        }`}
      >
        {value}
      </span>
    </div>
  )
}
