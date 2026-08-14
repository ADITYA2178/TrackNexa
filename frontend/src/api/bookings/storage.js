export function getStoredAuthUser() {
  try {
    return JSON.parse(localStorage.getItem('authUser'))
  } catch {
    return null
  }
}

export function getStoredHoldDraft() {
  try {
    return JSON.parse(sessionStorage.getItem('seatHoldDraft'))
  } catch {
    return null
  }
}

export function storeActiveHold(hold) {
  sessionStorage.setItem('activeHold', JSON.stringify(hold))
}

export function getStoredActiveHold() {
  try {
    return JSON.parse(sessionStorage.getItem('activeHold'))
  } catch {
    return null
  }
}
