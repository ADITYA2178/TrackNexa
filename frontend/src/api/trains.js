import { buildApiUrl } from '../config/api'

export async function searchTrains({ from, to, date }) {
  const response = await fetch(buildApiUrl('/api/trains/search'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, date }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to search trains')
  }

  return data
}

export function formatJourneyDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
