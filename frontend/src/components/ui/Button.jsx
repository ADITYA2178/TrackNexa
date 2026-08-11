export default function Button({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  ...props
}) {
  const variants = {
    primary:
      'bg-gold-gradient text-[#073936] shadow-[0_8px_18px_rgba(122,91,24,0.28)] hover:brightness-105',
    dark: 'bg-[#073936] text-white hover:bg-[#0B4A45]',
    ghost: 'text-[#073936] hover:bg-[#F7EAC2]',
  }

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
