import { buildApiUrl } from '../config/api'

export const TRAVEL_CLASSES = [
  { code: 'SL', name: 'Sleeper' },
  { code: '3A', name: 'AC 3 Tier' },
  { code: '3E', name: 'AC 3E' },
  { code: '2A', name: 'AC 2 Tier' },
  { code: '1A', name: 'AC First' },
  { code: 'CC', name: 'Chair Car' },
  { code: 'EC', name: 'Exec. Chair' },
  { code: '2S', name: 'Second Sitting' },
]

export async function getSeatAvailability({
  trainId,
  journeyDate,
  sourceStation,
  destinationStation,
  classCode,
}) {
  const response = await fetch(buildApiUrl('/api/trains/availability'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      trainId,
      journeyDate,
      sourceStation,
      destinationStation,
      classCode,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to check seat availability')
  }

  return data
}
