import { useState } from 'react'
import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import Button from '../../../components/ui/Button'
import DatePickerField from '../../../components/ui/DatePickerField'
import Dropdown from '../../../components/ui/Dropdown'
import TextInput from '../../../components/ui/TextInput'
import { LineIcon } from './HomeIcons'

const stationOptions = [
  { label: 'Mumbai Central', value: 'mumbai-central' },
  { label: 'New Delhi', value: 'new-delhi' },
  { label: 'Bengaluru City', value: 'bengaluru-city' },
  { label: 'Howrah Junction', value: 'howrah-junction' },
]

export default function JourneySearch() {
  const [origin, setOrigin] = useState('mumbai-central')
  const [destination, setDestination] = useState('new-delhi')
  const [journeyDate, setJourneyDate] = useState(new Date())
  const [passengers, setPassengers] = useState('1 passenger')

  return (
    <section
      id="book"
      className="relative overflow-visible rounded-3xl bg-[#073936] p-6 text-white shadow-[0_18px_45px_rgba(7,57,54,0.28)] sm:p-8"
    >
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-secondary/30" />
      <div className="absolute bottom-6 right-8 hidden text-secondary/20 sm:block">
        <TrachNexaLogo className="h-40 w-40" />
      </div>

      <div className="relative max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">
          Plan your journey
        </p>
        <h2 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-5xl">
          Where are you traveling today?
        </h2>
        <p className="mt-3 max-w-xl text-sm text-white/75 sm:text-base">
          Search routes, compare trains, and keep every trip detail in one place.
        </p>
      </div>

      <div className="relative z-20 mt-8 rounded-2xl border border-white/15 bg-white p-4 text-[#111827] shadow-2xl sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_180px_180px]">
          <Dropdown
            label="From"
            icon={<LineIcon type="pin" className="h-4 w-4" />}
            options={stationOptions}
            value={origin}
            onChange={setOrigin}
          />
          <Dropdown
            label="To"
            icon={<LineIcon type="swap" className="h-4 w-4" />}
            options={stationOptions}
            value={destination}
            onChange={setDestination}
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

        <Button className="mt-4 w-full py-3.5 text-base">Search Trains</Button>
      </div>
    </section>
  )
}
