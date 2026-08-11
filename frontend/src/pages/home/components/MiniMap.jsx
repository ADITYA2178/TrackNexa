import { LineIcon } from './HomeIcons'

export default function MiniMap() {
  return (
    <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-[#EEF0EC]">
      <svg className="h-full w-full" viewBox="0 0 66 58" aria-hidden="true">
        <path
          d="M-8 48 18 31 39 39 73 15M9 -5 24 16 18 39 32 63M42 -3 49 16 37 35 53 61"
          stroke="#C6CBC3"
          strokeWidth="4"
          fill="none"
        />
        <path
          d="M2 16 24 22 43 12 70 27M-4 36 18 28 36 35 68 25"
          stroke="#D9DCD7"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 text-[#073936]">
        <LineIcon type="pin" className="h-7 w-7 fill-[#073936]" />
      </div>
    </div>
  )
}
