function timeToMinutes(time) {
  if (!time) return null
  const [hh, mm, ss = 0] = String(time).split(':').map(Number)
  if ([hh, mm, ss].some((n) => Number.isNaN(n))) return null
  return hh * 60 + mm
}

function formatDurationFromMinutes(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined) return null
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

function formatDuration(departureTime, arrivalTime) {
  const start = timeToMinutes(departureTime)
  const end = timeToMinutes(arrivalTime)
  if (start === null || end === null) return null

  let diff = end - start
  if (diff < 0) diff += 24 * 60
  return formatDurationFromMinutes(diff)
}

function formatHalt(arrivalTime, departureTime, isFirst, isLast) {
  if (isFirst || isLast) return '0m'

  const arrival = String(arrivalTime || '')
  const departure = String(departureTime || '')
  if (!arrival || !departure || arrival === '00:00:00' || departure === '00:00:00') {
    return '0m'
  }

  const start = timeToMinutes(arrival)
  const end = timeToMinutes(departure)
  if (start === null || end === null) return '0m'

  let diff = end - start
  if (diff < 0) diff += 24 * 60
  return `${diff}m`
}

export { timeToMinutes, formatDurationFromMinutes, formatDuration, formatHalt }