export function LineIcon({ type, className = 'h-5 w-5' }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  }

  if (type === 'user') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.6-4 4-6 7-6s5.4 2 7 6" />
      </svg>
    )
  }

  if (type === 'pin') {
    return (
      <svg {...common}>
        <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    )
  }

  if (type === 'swap') {
    return (
      <svg {...common}>
        <path d="M7 7h11l-3-3M17 17H6l3 3" />
        <path d="M18 7v4M6 13v4" />
      </svg>
    )
  }

  if (type === 'calendar') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    )
  }

  if (type === 'ticket') {
    return (
      <svg {...common}>
        <path d="M4 8h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V8Z" />
        <path d="M8 9v8M12 9v8" />
      </svg>
    )
  }

  if (type === 'book') {
    return (
      <svg {...common}>
        <path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4-4V4Z" />
        <path d="M5 16V4" />
      </svg>
    )
  }

  if (type === 'bell') {
    return (
      <svg {...common}>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    )
  }

  if (type === 'map') {
    return (
      <svg {...common}>
        <path d="M9 4 3 6.5V20l6-2.5L15 20l6-2.5V4.5L15 7 9 4Z" />
        <path d="M9 4v13.5M15 7v13" />
        <circle cx="15" cy="11" r="2.2" />
        <path d="M15 13.2V17" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  )
}
