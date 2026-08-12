import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchStations } from '../../api/stations'

function formatStationName(name = '') {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getStationLabel(station) {
  if (!station) return ''
  return formatStationName(station.station_name)
}

export default function StationSelect({
  label,
  icon,
  value,
  onChange,
  placeholder = 'City, station or code',
  className = '',
}) {
  const containerRef = useRef(null)
  const [query, setQuery] = useState(getStationLabel(value))
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setQuery(getStationLabel(value))
  }, [value])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
        setQuery(getStationLabel(value))
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery(getStationLabel(value))
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [value])

  const canSearch = open && debouncedQuery.length >= 2
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['stations', 'search', debouncedQuery],
    queryFn: () => searchStations(debouncedQuery, { limit: 10 }),
    enabled: canSearch,
    staleTime: 60_000,
  })

  const stations = data?.stations ?? []

  const selectStation = (station) => {
    onChange(station)
    setQuery(getStationLabel(station))
    setOpen(false)
  }

  const handleInputChange = (event) => {
    const nextQuery = event.target.value
    setQuery(nextQuery)
    setOpen(true)

    if (value && nextQuery.trim() !== getStationLabel(value)) {
      onChange(null)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${open ? 'z-40' : 'z-10'} ${className}`}>
      <label className="block rounded-xl border border-[#E4D7AD] px-4 py-3">
        <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8E722B]">
          {icon}
          {label}
        </span>
        <span className="flex items-center gap-2">
          <input
            value={query}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent text-base font-semibold text-[#111827] outline-none placeholder:font-medium placeholder:text-slate/50"
          />
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className={`h-4 w-4 shrink-0 text-[#8E722B] transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path
              d="M5 7.5 10 12.5 15 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </label>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-xl border border-[#E4D7AD] bg-white shadow-2xl">
          {!canSearch ? (
            <p className="px-4 py-3 text-sm text-slate/70">Type at least 2 characters to search</p>
          ) : isFetching ? (
            <p className="px-4 py-3 text-sm text-slate/70">Searching stations...</p>
          ) : isError ? (
            <p className="px-4 py-3 text-sm text-red-600">{error.message}</p>
          ) : stations.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate/70">No stations found</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {stations.map((station) => {
                const isSelected = value?.station_code === station.station_code

                return (
                  <li key={station.station_code}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectStation(station)}
                      className={`flex w-full items-start justify-between gap-3 px-4 py-2.5 text-left hover:bg-[#F7EAC2] ${
                        isSelected ? 'bg-[#F7EAC2]' : ''
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-[#111827]">
                          {formatStationName(station.station_name)}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate/70">
                          {formatStationName(station.city)}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-md bg-[#073936] px-2 py-0.5 text-xs font-bold tracking-wide text-white">
                        {station.station_code}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
