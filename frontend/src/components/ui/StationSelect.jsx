import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { resolveStationSuggestions } from '../../api/stations'
import { StationListSkeleton } from './Skeleton'

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
    queryKey: ['stations', 'suggest', debouncedQuery],
    queryFn: () => resolveStationSuggestions(debouncedQuery, { limit: 10 }),
    enabled: canSearch,
    staleTime: 60_000,
  })

  const stations = data?.stations ?? []
  const hint =
    data?.source === 'code'
      ? 'Exact station code'
      : data?.source === 'city'
        ? 'Stations in this city'
        : null

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
    <div ref={containerRef} className={`relative flex-1 ${open ? 'z-40' : 'z-10'} ${className}`}>
      <label className="flex flex-col rounded-2xl border-2 border-line bg-white px-4 py-3">
        <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary-deep">
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
            className="w-full bg-transparent text-base font-semibold text-charcoal outline-none placeholder:font-medium placeholder:text-slate"
          />
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className={`h-4 w-4 shrink-0 text-primary-deep transition-transform ${open ? 'rotate-180' : ''}`}
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
        <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 max-h-[min(16rem,50vh)] overflow-hidden rounded-2xl border-2 border-line bg-white shadow-card">
          {!canSearch ? (
            <p className="px-4 py-3 text-sm text-slate">Type at least 2 characters to search</p>
          ) : isFetching ? (
            <StationListSkeleton count={5} />
          ) : isError ? (
            <p className="px-4 py-3 text-sm text-red-600">{error.message}</p>
          ) : stations.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate">No stations found</p>
          ) : (
            <>
              {hint ? (
                <p className="border-b border-line px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">
                  {hint}
                </p>
              ) : null}
              <ul className="flex max-h-[min(16rem,50vh)] flex-col overflow-y-auto py-1">
                {stations.map((station) => {
                  const isSelected = value?.station_code === station.station_code

                  return (
                    <li key={station.station_code}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectStation(station)}
                        className={`flex w-full items-start justify-between gap-3 px-4 py-2.5 text-left hover:bg-sky-soft ${
                          isSelected ? 'bg-sky-soft' : ''
                        }`}
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-semibold text-charcoal">
                            {formatStationName(station.station_name)}
                          </span>
                          <span className="mt-0.5 truncate text-xs text-slate">
                            {formatStationName(station.city)}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-charcoal px-2 py-0.5 text-xs font-bold tracking-wide text-white">
                          {station.station_code}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
