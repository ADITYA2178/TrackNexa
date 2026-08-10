import TrachNexaLogo from '../../../assets/TrachNexaLogo'
import Button from '../../../components/ui/Button'

export default function HomeHeader() {
  return (
    <header className="flex flex-col gap-5 border-b border-[#E9DFC0] bg-white/80 px-6 py-5 backdrop-blur sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
      <div className="flex items-center gap-4">
        <TrachNexaLogo className="h-14 w-14 text-secondary" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8E722B]">
            Trach Nexa
          </p>
          <h1 className="font-heading text-2xl font-bold leading-tight text-[#073936] sm:text-3xl">
            Welcome back, Elizabeth
          </h1>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm font-semibold text-[#073936]">
        <Button className="px-4 py-2" variant="dark">
          Home
        </Button>
        <a href="#book" className="rounded-full px-4 py-2 hover:bg-[#F7EAC2]">
          Book
        </a>
        <a href="#track" className="rounded-full px-4 py-2 hover:bg-[#F7EAC2]">
          Track
        </a>
        <a href="#profile" className="rounded-full px-4 py-2 hover:bg-[#F7EAC2]">
          Profile
        </a>
      </nav>
    </header>
  )
}
