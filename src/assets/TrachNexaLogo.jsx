export default function TrachNexaLogo({ className = 'h-12 w-12 text-secondary' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 16 44 16 50 22V44L43 51H21L14 44V22L20 16Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M24 11h16M32 11v5M24 8l8 3 8-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 24h20v13H22V24Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M25 27 39 34M39 27 25 34M18 22l8 8M46 22l-8 8M18 42l8-8M46 42l-8-8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="23" cy="43" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="41" cy="43" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M23 51 15 60M41 51l8 9M23 55h18M19 60h26"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 33c4-2.7 8-2.7 12 0s8 2.7 12 0 8-2.7 12 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M18 18c3 5 3 9 0 14M46 18c-3 5-3 9 0 14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  )
}
