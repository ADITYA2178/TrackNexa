import { buildApiUrl } from '../config/api'

async function requestStations(path) {
  const response = await fetch(buildApiUrl(path))
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to load stations')
  }

  return data
}

function looksLikeStationCode(query) {
  return /^[A-Za-z0-9]{2,5}$/.test(String(query || '').trim())
}

function mergeStations(...lists) {
  const seen = new Set()
  const stations = []

  for (const list of lists) {
    for (const station of list ?? []) {
      const code = station?.station_code
      if (!code || seen.has(code)) continue
      seen.add(code)
      stations.push(station)
    }
  }

  return stations
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

/** Resolve suggestions: exact code, city filter, then general search. */
export async function resolveStationSuggestions(query, { limit = 10 } = {}) {
  const term = String(query || '').trim()
  if (!term) return { stations: [], source: 'empty' }

  if (looksLikeStationCode(term)) {
    try {
      const station = await getStationByCode(term)
      return {
        stations: station ? [station] : [],
        source: 'code',
      }
    } catch {
      // Fall through to search if code is unknown
    }
  }

  const [cityResult, searchResult] = await Promise.allSettled([
    getStationsByCity(term, { limit }),
    searchStations(term, { limit }),
  ])

  const cityStations =
    cityResult.status === 'fulfilled' ? (cityResult.value?.stations ?? []) : []
  const searchStationsList =
    searchResult.status === 'fulfilled' ? (searchResult.value?.stations ?? []) : []

  if (cityResult.status === 'rejected' && searchResult.status === 'rejected') {
    throw searchResult.reason ?? cityResult.reason
  }

  return {
    stations: mergeStations(cityStations, searchStationsList).slice(0, limit),
    source: cityStations.length ? 'city' : 'search',
  }
}
