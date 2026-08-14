import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from './components/icons'

export default function SignUpField({
  id,
  label,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  rightSlot,
  leftAddon,
  revealable = false,
}) {
  const [revealed, setRevealed] = useState(false)
  const inputType = revealable ? (revealed ? 'text' : 'password') : type

  const revealSlot = revealable ? (
    <button
      type="button"
      onClick={() => setRevealed((v) => !v)}
      className="shrink-0 text-primary-deep"
      aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
    >
      {revealed ? <EyeIcon /> : <EyeOffIcon />}
    </button>
  ) : (
    rightSlot
  )

  return (
    <div>
      <label htmlFor={id} className="tn-label">
        {label}
      </label>
      <div className="flex items-center gap-2 border-b-2 border-line transition-colors focus-within:border-primary-deep">
        {leftAddon}
        <span className="shrink-0 text-primary-deep">{icon}</span>
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full border-none bg-transparent py-2 text-[0.95rem] text-charcoal outline-none placeholder:text-slate"
          autoComplete={
            inputType === 'password' || type === 'password'
              ? 'new-password'
              : type === 'email'
                ? 'email'
                : 'off'
          }
        />
        {revealSlot}
      </div>
    </div>
  )
}
