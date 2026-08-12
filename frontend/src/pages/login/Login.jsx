import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import { buildApiUrl } from '../../config/api'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '../signup/components/icons'

function Field({ id, label, icon, type = 'text', placeholder, value, onChange, rightSlot }) {
  return (
    <div>
      <label htmlFor={id} className="tn-label">
        {label}
      </label>
      <div className="flex items-center gap-2 border-b-2 border-line transition-colors focus-within:border-primary-deep">
        <span className="shrink-0 text-primary-deep">{icon}</span>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full border-none bg-transparent py-2 text-[0.95rem] text-charcoal outline-none placeholder:text-slate"
          autoComplete={type === 'password' ? 'current-password' : 'email'}
        />
        {rightSlot}
      </div>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const loginMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch(buildApiUrl('/api/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to log in')
      }

      return data
    },
    onSuccess: (data) => {
      const authToken = data?.token ?? data?.accessToken ?? data?.data?.token ?? 'authenticated'
      localStorage.setItem('authToken', authToken)
      toast.success(data?.message ?? 'Logged in successfully')
      navigate('/home')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const update = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    loginMutation.mutate({
      email: form.email,
      password: form.password,
    })
  }

  return (
    <>
      <div className="tn-card">
        <div className="mb-6 flex flex-col items-center text-center">
          <TrachNexaLogo className="mb-2 h-12 w-12 text-primary-deep" />
          <p className="font-heading text-xl font-bold tracking-[0.08em] text-primary-deep">
            TRACK NEXA
          </p>
          <h1 className="mt-3 font-heading text-[1.55rem] font-bold leading-tight text-charcoal sm:text-[1.7rem]">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-slate">Log in to continue your journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            id="password"
            label="Password"
            icon={<LockIcon />}
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter Password"
            value={form.password}
            onChange={update('password')}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="shrink-0 text-primary-deep"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            }
          />

          <button
            type="submit"
            className="tn-btn-accent mt-2 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Logging In...' : 'Log In'}
          </button>
        </form>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/35" />
        <p className="whitespace-nowrap text-sm font-semibold text-white">
          New to Track Nexa?{' '}
          <Link to="/signup" className="font-bold text-white hover:text-secondary">
            Sign Up
          </Link>
        </p>
        <div className="h-px flex-1 bg-white/35" />
      </div>
    </>
  )
}
