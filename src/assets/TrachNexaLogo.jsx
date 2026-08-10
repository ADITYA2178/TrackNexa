export default function TrachNexaLogo({ className = 'h-12 w-12 text-secondary' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Geometric Train outline */}
      <rect x="4" y="3" width="16" height="14" rx="2" />
      <path d="M8 21L12 17L16 21" />
      <path d="M9 17L5 21" />
      <path d="M15 17L19 21" />
      <line x1="8" y1="3" x2="8" y2="8" />
      <line x1="16" y1="3" x2="16" y2="8" />
      {/* Abstract geometric inner lines for that modern luxury feel */}
      <circle cx="12" cy="10" r="3" />
      <path d="M4 13H20" />
    </svg>
  )
}
