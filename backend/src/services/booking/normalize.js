const normalizeGender = (gender) => {
  const g = String(gender || '')
    .trim()
    .toUpperCase()
  if (g === 'M') return 'MALE'
  if (g === 'F') return 'FEMALE'
  if (g === 'O') return 'OTHER'
  return g
}

const normalizePreference = (pref) => {
  const value = String(pref || 'ANY')
    .trim()
    .toUpperCase()
  if (!value || value === 'NONE') return 'ANY'
  return value
}

export { normalizeGender, normalizePreference }