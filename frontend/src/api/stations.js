import { buildApiUrl } from '../config/api'

async function requestStations(path) {
  const response = await fetch(buildApiUrl(path))
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to load stations')
  }

  return data
}

export function searchStations(query, { limit = 10 } = {}) {
  const params = new URLSearchParams({
    search: query,
    limit: String(limit),
  })

  return requestStations(`/api/stations?${params}`)
}

export function getStationsByCity(city, { limit = 10 } = {}) {
  const params = new URLSearchParams({
    city,
    limit: String(limit),
  })

  return requestStations(`/api/stations?${params}`)
}

export async function getStationByCode(stationCode) {
  const data = await requestStations(`/api/stations/${encodeURIComponent(stationCode)}`)
  return data?.station ?? data
}
