import { LineIcon } from './HomeIcons'

export default function ShortcutCard({ icon, label }) {
  return (
    <button
      type="button"
      className="group flex items-center gap-3 rounded-2xl border border-[#E9DFC0] bg-white px-4 py-4 text-left text-sm text-[#111827] shadow-sm transition hover:-translate-y-0.5 hover:border-secondary hover:shadow-lg"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7EAC2] text-secondary transition group-hover:bg-gold-gradient group-hover:text-[#073936]">
        <LineIcon type={icon} className="h-6 w-6" />
      </span>
      <span className="font-semibold">{label}</span>
    </button>
  )
}
