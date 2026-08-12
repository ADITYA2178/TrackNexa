export default function Button({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  ...props
}) {
  const variants = {
    primary:
      'bg-primary-deep text-white shadow-glow hover:bg-charcoal',
    dark: 'bg-charcoal text-white hover:bg-primary-deep',
    ghost: 'text-charcoal hover:bg-sky-soft',
  }

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-bold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
