import { LineIcon } from './HomeIcons'

export default function ShortcutCard({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border-2 border-line bg-white px-4 py-4 text-left text-sm text-charcoal shadow-sm transition hover:-translate-y-0.5 hover:border-primary-deep hover:shadow-glow"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-soft text-primary-deep transition group-hover:bg-aqua-gradient group-hover:text-charcoal">
        <LineIcon type={icon} className="h-6 w-6" />
      </span>
      <span className="min-w-0 font-semibold">{label}</span>
    </button>
  )
}
