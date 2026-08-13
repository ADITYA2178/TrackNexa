import { useNavigate } from 'react-router-dom'
import HomeHeader from './components/HomeHeader'
import JourneySearch from './components/JourneySearch'
import LiveUpdates from './components/LiveUpdates'
import ShortcutCard from './components/ShortcutCard'
import StatCard from './components/StatCard'
import TripSummary from './components/TripSummary'

export default function HomeScreen() {
  const navigate = useNavigate()

  return (
    <section className="flex min-h-dvh flex-col bg-sky-mist">
      <HomeHeader />

      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 lg:flex-row lg:gap-8 lg:p-10">
        <div className="flex min-w-0 flex-1 flex-col gap-5 sm:gap-6">
          <JourneySearch />

          <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3 sm:gap-4">
            <StatCard label="Trips" value="12" detail="Booked this month" />
            <StatCard label="Saved" value="08" detail="Favorite routes" />
            <StatCard label="Status" value="98%" detail="On-time tracking" />
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <ShortcutCard
              icon="ticket"
              label="Book Tickets"
              onClick={() => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' })}
            />
            <ShortcutCard icon="pin" label="Live Tracking" />
            <ShortcutCard
              icon="book"
              label="PNR Status"
              onClick={() => navigate('/booking/pnr')}
            />
            <ShortcutCard
              icon="bell"
              label="My Bookings"
              onClick={() => navigate('/booking/my')}
            />
          </section>
        </div>

        <aside className="flex w-full flex-col gap-5 sm:gap-6 lg:w-[min(360px,100%)] lg:shrink-0">
          <TripSummary />
          <LiveUpdates />
        </aside>
      </main>
    </section>
  )
}
