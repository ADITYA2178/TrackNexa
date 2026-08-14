export function resolveHoldSummary(holdId, holdFromState, storedHold) {
  const id = String(holdId || '').trim()
  if (!id) return null
  if (holdFromState?.holdId === id) return holdFromState
  if (storedHold?.holdId === id) return storedHold
  return null
}

export function stationLabel(station) {
  return station?.code ?? station?.name ?? station
}
