import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import { formatJourneyDate, searchTrains } from '../../../api/trains'
import Button from '../../../components/ui/Button'
import DatePickerField from '../../../components/ui/DatePickerField'
import StationSelect from '../../../components/ui/StationSelect'
import TextInput from '../../../components/ui/TextInput'
import { LineIcon } from './HomeIcons'
import TrainResults from './TrainResults'

export default function JourneySearch() {
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [journeyDate, setJourneyDate] = useState(new Date())
  const [passengers, setPassengers] = useState('1 passenger')

  const searchMutation = useMutation({
    mutationFn: searchTrains,
    onSuccess: (data) => {
      toast.success(`${data?.total ?? data?.trains?.length ?? 0} trains found`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSearch = () => {
    if (!origin?.station_code || !destination?.station_code) {
      toast.error('Please select both From and To stations')
      return
    }

    if (origin.station_code === destination.station_code) {
      toast.error('From and To stations must be different')
      return
    }

    if (!journeyDate) {
      toast.error('Please select a journey date')
      return
    }

    searchMutation.mutate({
      from: origin.station_code,
      to: destination.station_code,
      date: formatJourneyDate(journeyDate),
    })
  }

  return (
    <section
      id="book"
      className="relative overflow-visible rounded-[1.5rem] bg-charcoal p-4 text-white shadow-card sm:rounded-[2rem] sm:p-6 md:p-8"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-secondary/20 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 left-10 h-32 w-32 rounded-full bg-sky/20 blur-2xl" />
      <div className="absolute bottom-6 right-8 hidden text-secondary/20 lg:block">
        <TrachNexaLogo className="h-40 w-40" />
      </div>

      <div className="relative max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary sm:text-sm">
          Plan your journey
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold leading-tight text-white sm:mt-3 sm:text-4xl md:text-5xl">
          Where are you traveling today?
        </h2>
        <p className="mt-2 max-w-xl text-sm text-white/75 sm:mt-3 sm:text-base">
          Search routes, compare trains, and keep every trip detail in one place.
        </p>
      </div>

      <div className="relative z-20 mt-6 rounded-2xl border-2 border-line bg-white p-3 text-charcoal shadow-2xl sm:mt-8 sm:rounded-3xl sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StationSelect
            label="From"
            icon={<LineIcon type="pin" className="h-4 w-4" />}
            value={origin}
            onChange={setOrigin}
            placeholder="Search station"
          />
          <StationSelect
            label="To"
            icon={<LineIcon type="swap" className="h-4 w-4" />}
            value={destination}
            onChange={setDestination}
            placeholder="Search station"
          />
          <DatePickerField
            label="Date"
            icon={<LineIcon type="calendar" className="h-4 w-4" />}
            value={journeyDate}
            onChange={setJourneyDate}
          />
          <TextInput
            label="Passengers"
            icon={<LineIcon type="user" className="h-4 w-4" />}
            value={passengers}
            onChange={(event) => setPassengers(event.target.value)}
          />
        </div>

        <Button
          className="mt-4 w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-70"
          onClick={handleSearch}
          disabled={searchMutation.isPending}
        >
          {searchMutation.isPending ? 'Searching...' : 'Search Trains'}
        </Button>

        {searchMutation.data ? <TrainResults result={searchMutation.data} /> : null}
      </div>
    </section>
  )
}
