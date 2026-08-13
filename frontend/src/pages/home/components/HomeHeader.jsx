import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import Button from '../../../components/ui/Button'

export default function HomeHeader() {
  return (
    <header className="flex flex-col gap-4 border-b-2 border-line bg-white px-4 py-4 sm:gap-5 sm:px-6 sm:py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <TrachNexaLogo className="h-11 w-11 shrink-0 text-primary-deep sm:h-14 sm:w-14" />
        <div className="flex min-w-0 flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary-deep sm:text-xs">
            Track Nexa
          </p>
          <h1 className="truncate font-heading text-xl font-bold leading-tight text-charcoal sm:text-2xl md:text-3xl">
            Welcome back, Elizabeth
          </h1>
        </div>
      </div>

      <nav className="-mx-1 flex flex-wrap items-center gap-1 text-sm font-semibold text-charcoal sm:mx-0 sm:gap-2">
        <Button className="px-3 py-2 sm:px-4" variant="dark">
          Home
        </Button>
        <a href="#book" className="rounded-full px-3 py-2 hover:bg-sky-soft sm:px-4">
          Book
        </a>
        <a href="#track" className="rounded-full px-3 py-2 hover:bg-sky-soft sm:px-4">
          Track
        </a>
        <a href="#profile" className="rounded-full px-3 py-2 hover:bg-sky-soft sm:px-4">
          Profile
        </a>
      </nav>
    </header>
  )
}
