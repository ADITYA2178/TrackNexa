import HomeHeader from './components/HomeHeader'
import JourneySearch from './components/JourneySearch'
import LiveUpdates from './components/LiveUpdates'
import ShortcutCard from './components/ShortcutCard'
import StatCard from './components/StatCard'
import TripSummary from './components/TripSummary'

export default function HomeScreen() {
  return (
    <section className="flex h-screen min-h-screen overflow-hidden bg-[#FFFDF8]">
      <div className="flex min-h-0 flex-1 flex-col">
        <HomeHeader />

        <main className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 sm:p-8 lg:grid-cols-[1.3fr_0.85fr] lg:p-10">
          <div className="flex flex-col gap-6">
            <JourneySearch />

            <section className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Trips" value="12" detail="Booked this month" />
              <StatCard label="Saved" value="08" detail="Favorite routes" />
              <StatCard label="Status" value="98%" detail="On-time tracking" />
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ShortcutCard icon="ticket" label="Book Tickets" />
              <ShortcutCard icon="pin" label="Live Tracking" />
              <ShortcutCard icon="book" label="PNR Status" />
              <ShortcutCard icon="bell" label="Saved Routes" />
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <TripSummary />
            <LiveUpdates />
          </aside>
        </main>
      </div>
    </section>
  )
}
