export function getStoredSelection() {
  try {
    return JSON.parse(sessionStorage.getItem('selectedTrain'))
  } catch {
    return null
  }
}
