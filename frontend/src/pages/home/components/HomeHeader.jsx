import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import Button from '../../../components/ui/Button'

export default function HomeHeader() {
  return (
    <header className="flex flex-col gap-5 border-b-2 border-line bg-white px-6 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
      <div className="flex items-center gap-4">
        <TrachNexaLogo className="h-14 w-14 text-primary-deep" />
        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary-deep">
            Track Nexa
          </p>
          <h1 className="font-heading text-2xl font-bold leading-tight text-charcoal sm:text-3xl">
            Welcome back, Elizabeth
          </h1>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-charcoal">
        <Button className="px-4 py-2" variant="dark">
          Home
        </Button>
        <a href="#book" className="rounded-full px-4 py-2 hover:bg-sky-soft">
          Book
        </a>
        <a href="#track" className="rounded-full px-4 py-2 hover:bg-sky-soft">
          Track
        </a>
        <a href="#profile" className="rounded-full px-4 py-2 hover:bg-sky-soft">
          Profile
        </a>
      </nav>
    </header>
  )
}
