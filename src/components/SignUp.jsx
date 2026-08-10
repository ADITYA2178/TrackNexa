import { useState } from 'react'
import TrachNexaLogo from '../assets/TrachNexaLogo'
import {
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  IndiaFlagIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from './icons'

function Field({
  id,
  label,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  rightSlot,
  leftAddon,
}) {
  return (
    <div>
      <label htmlFor={id} className="tn-label">
        {label}
      </label>
      <div className="flex items-center gap-2 border-b-[1.5px] border-gray-300 transition-colors focus-within:border-secondary">
        {leftAddon}
        <span className="shrink-0 text-secondary">{icon}</span>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full border-none bg-transparent py-2 text-[0.95rem] text-charcoal outline-none placeholder:text-gray-400"
          autoComplete={
            type === 'password'
              ? 'new-password'
              : type === 'email'
                ? 'email'
                : 'off'
          }
        />
        {rightSlot}
      </div>
    </div>
  )
}

export default function SignUp() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    agree: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
  }

  return (
    <div className="tn-auth-bg relative flex min-h-screen items-center justify-center px-4 py-10">
      {/* Corner train accents */}
      <TrachNexaLogo className="pointer-events-none absolute left-4 top-4 z-0 h-10 w-10 text-secondary/80 sm:left-8 sm:top-8 sm:h-12 sm:w-12" />
      <TrachNexaLogo className="pointer-events-none absolute bottom-[-2rem] right-[-1rem] z-0 h-48 w-48 text-primary-darker/40 sm:h-64 sm:w-64" />

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="tn-card">
          {/* Brand */}
          <div className="mb-5 flex flex-col items-center text-center">
            <TrachNexaLogo className="mb-2 h-9 w-9 text-secondary" />
            <p className="font-heading text-xl font-bold tracking-[0.08em] text-secondary">
              TRACK NEXA
            </p>
            <h1 className="mt-3 font-heading text-[1.55rem] font-bold leading-tight text-charcoal sm:text-[1.7rem]">
              Create Your Nexa Account
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field
              id="fullName"
              label="Full Name"
              icon={<UserIcon />}
              placeholder="Elizabeth Bennett"
              value={form.fullName}
              onChange={update('fullName')}
            />

            <Field
              id="email"
              label="Email Address"
              icon={<MailIcon />}
              type="email"
              placeholder="e.bennett@email.com"
              value={form.email}
              onChange={update('email')}
            />

            <Field
              id="mobile"
              label="Mobile Number"
              icon={<PhoneIcon />}
              type="tel"
              placeholder="+91-9876543210"
              value={form.mobile}
              onChange={update('mobile')}
              leftAddon={
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1 pr-1 text-sm text-slate"
                  aria-label="Select country code"
                >
                  <IndiaFlagIcon />
                  <span className="font-medium text-charcoal">+91</span>
                  <ChevronDownIcon className="h-3.5 w-3.5 text-slate" />
                </button>
              }
            />

            <Field
              id="password"
              label="Create Password"
              icon={<LockIcon />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Create Password"
              value={form.password}
              onChange={update('password')}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 text-secondary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              }
            />

            <Field
              id="confirmPassword"
              label="Confirm Password"
              icon={<LockIcon />}
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="shrink-0 text-secondary"
                  aria-label={
                    showConfirm ? 'Hide confirm password' : 'Show confirm password'
                  }
                >
                  {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              }
            />

            <label className="flex items-start gap-2.5 pt-1 text-sm text-slate">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={update('agree')}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span>
                I agree to the{' '}
                <a
                  href="#terms"
                  className="font-semibold text-primary hover:text-primary-hover"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="#privacy"
                  className="font-semibold text-primary hover:text-primary-hover"
                >
                  Privacy Policy
                </a>
              </span>
            </label>

            <button type="submit" className="tn-btn-accent mt-2">
              Create Account
            </button>
          </form>
        </div>

        {/* Footer login link */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/35" />
          <p className="whitespace-nowrap text-sm text-white/90">
            Already have an account?{' '}
            <a
              href="#login"
              className="font-bold text-secondary hover:text-secondary-hover"
            >
              Log In
            </a>
          </p>
          <div className="h-px flex-1 bg-white/35" />
        </div>
      </div>
    </div>
  )
}
