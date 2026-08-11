export default function BackgroundWrapper({
  children,
  contentClassName = 'max-w-[290px]',
  paddingClassName = 'p-4',
}) {
  return (
    <div
      className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#073936] ${paddingClassName}`}
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,#0f4b45_0%,#073936_56%,#062421_100%)]" />

      <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1024 576"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="nexa-map-pattern"
              x="0"
              y="0"
              width="420"
              height="320"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M-80 260 80 100 170 190 280 80 500 300M40 340 180 210 300 270 430 150M250 -50 350 90 270 210 390 330"
                stroke="#A8B9AE"
                strokeWidth="5"
                fill="none"
              />
              <path
                d="M-40 60 100 140 210 120 340 250 460 180"
                stroke="#A8B9AE"
                strokeWidth="3"
                fill="none"
                opacity="0.6"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nexa-map-pattern)" />
          <path
            d="M730 -40 820 95 792 172 930 298 1060 245M790 0 875 130 840 205 935 288M-80 472 78 348 166 456 278 330"
            stroke="#A8B9AE"
            strokeWidth="7"
            opacity="0.28"
            fill="none"
          />
        </svg>
      </div>

      <div className={`relative z-10 w-full ${contentClassName}`}>{children}</div>
    </div>
  )
}
