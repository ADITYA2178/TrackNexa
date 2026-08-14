export default function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider transition sm:text-[11px] ${
        active
          ? 'bg-charcoal text-white'
          : 'bg-white text-slate border-2 border-line hover:border-primary-deep'
      }`}
    >
      {children}
    </button>
  )
}
