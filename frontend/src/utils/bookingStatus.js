export function statusTone(status) {
  if (status === 'CONFIRMED') return 'bg-sky-soft text-primary-deep'
  if (status === 'CANCELLED') return 'bg-[#FFF0F0] text-[#8A3A3A]'
  if (status === 'EXPIRED') return 'bg-[#FFF6E8] text-[#8A5A20]'
  return 'bg-sky-mist text-slate'
}
