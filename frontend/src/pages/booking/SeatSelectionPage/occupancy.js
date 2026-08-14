export function occupancyTone(available, total) {
  if (!total) return 'bg-slate/20'
  const ratio = available / total
  if (ratio > 0.4) return 'bg-secondary'
  if (ratio > 0.15) return 'bg-primary'
  return 'bg-[#E07A7A]'
}
