export function formatStationName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export function formatTime(time) {
  if (!time || time === '00:00:00' || time === '-' || time === 'null') return '—'
  const [hours, minutes] = String(time).split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return String(time)

  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

export function formatDateTime(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatHoldExpiry(heldUntil) {
  if (!heldUntil) return null
  const date = new Date(heldUntil)
  if (Number.isNaN(date.getTime())) return String(heldUntil)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function formatHalt(minutes) {
  if (minutes == null || minutes === '' || minutes === '-') return '—'
  if (typeof minutes === 'number') return `${minutes} min`
  return String(minutes)
}
