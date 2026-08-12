import HomeHeader from './components/HomeHeader'
import JourneySearch from './components/JourneySearch'
import LiveUpdates from './components/LiveUpdates'
import ShortcutCard from './components/ShortcutCard'
import StatCard from './components/StatCard'
import TripSummary from './components/TripSummary'

export default function HomeScreen() {
  return (
    <section className="flex h-screen min-h-screen overflow-hidden bg-sky-mist">
      <div className="flex min-h-0 flex-1 flex-col">
        <HomeHeader />

        <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 sm:p-8 lg:flex-row lg:p-10">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <JourneySearch />

            <section className="flex flex-col gap-4 sm:flex-row">
              <StatCard label="Trips" value="12" detail="Booked this month" />
              <StatCard label="Saved" value="08" detail="Favorite routes" />
              <StatCard label="Status" value="98%" detail="On-time tracking" />
            </section>

            <section className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <ShortcutCard icon="ticket" label="Book Tickets" />
              <ShortcutCard icon="pin" label="Live Tracking" />
              <ShortcutCard icon="book" label="PNR Status" />
              <ShortcutCard icon="bell" label="Saved Routes" />
            </section>
          </div>

          <aside className="flex w-full flex-col gap-6 lg:w-[360px] lg:shrink-0">
            <TripSummary />
            <LiveUpdates />
          </aside>
        </main>
      </div>
    </section>
  )
}
