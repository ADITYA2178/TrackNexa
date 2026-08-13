export default function BackgroundWrapper({
  children,
  contentClassName = 'max-w-[290px]',
  paddingClassName = 'p-4',
  className = '',
}) {
  return (
    <div
      className={`relative flex min-h-dvh w-full items-center justify-center overflow-x-clip bg-charcoal ${paddingClassName} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-horizon-radial" />
      <div className="pointer-events-none absolute -left-24 top-10 z-0 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 z-0 h-80 w-80 rounded-full bg-sky/25 blur-3xl" />

      <div className="pointer-events-none absolute inset-0 z-0 opacity-25">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1024 576"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-40 420 C180 280, 360 500, 560 320 S920 180, 1100 340"
            stroke="#7DD3FC"
            strokeWidth="3"
            fill="none"
            opacity="0.45"
          />
          <path
            d="M-80 300 C140 180, 340 360, 540 220 S900 80, 1120 240"
            stroke="#2EE6D6"
            strokeWidth="2"
            fill="none"
            opacity="0.35"
          />
        </svg>
      </div>

      <div className={`relative z-10 w-full ${contentClassName}`}>{children}</div>
    </div>
  )
}
