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

export async function getTrainRoute({ from, to, trainNo }) {
  const response = await fetch(buildApiUrl('/api/trains/route'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, trainNo }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to load train route')
  }

  return data
}

export function normalizeRouteStops(data) {
  const stops =
    data?.stops ??
    data?.route ??
    data?.stations ??
    data?.halts ??
    data?.data?.stops ??
    data?.data?.route ??
    []

  return stops.map((stop, index) => ({
    seq: stop.seq ?? stop.sequence ?? stop.haltNumber ?? index + 1,
    code: stop.code ?? stop.stationCode ?? stop.stnCode ?? stop.station_code ?? '',
    name: stop.name ?? stop.stationName ?? stop.stnName ?? stop.station_name ?? '',
    arrivalTime: stop.arrivalTime ?? stop.arrival ?? stop.arr ?? stop.eta ?? '',
    departureTime: stop.departureTime ?? stop.departure ?? stop.dep ?? stop.etd ?? '',
    haltMinutes: stop.haltMinutes ?? stop.halt ?? stop.haltTime ?? null,
    distanceKm: stop.distanceKm ?? stop.distance ?? stop.dist ?? null,
  }))
}

export function formatJourneyDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

