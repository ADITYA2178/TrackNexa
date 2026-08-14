import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import TrachNexaLogo from '../../assets/TrachNexaLogo'
import { signUp } from '../../api/auth'
import {
  ChevronDownIcon,
  IndiaFlagIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from './components/icons'
import SignUpField from './SignUpField'

export default function SignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    agree: true,
  })

  const signUpMutation = useMutation({
    mutationFn: signUp,
    onSuccess: (data) => {
      toast.success(data?.message ?? 'Account created successfully')
      navigate('/login')
    },
    onError: (error) => toast.error(error.message),
  })

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    signUpMutation.mutate({
      fullName: form.fullName,
      email: form.email,
      mobileNumber: form.mobile,
      password: form.password,
      confirmPassword: form.confirmPassword,
    })
  }

  return (
    <>
      <div className="tn-card">
        <div className="mb-5 flex flex-col items-center text-center">
          <TrachNexaLogo className="mb-2 h-12 w-12 text-primary-deep" />
          <p className="font-heading text-xl font-bold tracking-[0.08em] text-primary-deep">
            TRACK NEXA
          </p>
          <h1 className="mt-3 font-heading text-[1.55rem] font-bold leading-tight text-charcoal sm:text-[1.7rem]">
            Create Your Nexa Account
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <SignUpField
            id="fullName"
            label="Full Name"
            icon={<UserIcon />}
            placeholder="Elizabeth Bennett"
            value={form.fullName}
            onChange={update('fullName')}
          />
          <SignUpField
            id="email"
            label="Email Address"
            icon={<MailIcon />}
            type="email"
            placeholder="e.bennett@email.com"
            value={form.email}
            onChange={update('email')}
          />
          <SignUpField
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
          <SignUpField
            id="password"
            label="Create Password"
            icon={<LockIcon />}
            revealable
            placeholder="Create Password"
            value={form.password}
            onChange={update('password')}
          />
          <SignUpField
            id="confirmPassword"
            label="Confirm Password"
            icon={<LockIcon />}
            revealable
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
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
              <a href="#terms" className="font-semibold text-primary-deep hover:text-primary">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="font-semibold text-primary-deep hover:text-primary">
                Privacy Policy
              </a>
            </span>
          </label>

          <button
            type="submit"
            className="tn-btn-accent mt-2 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={signUpMutation.isPending}
          >
            {signUpMutation.isPending ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:items-center">
        <div className="hidden h-px flex-1 bg-white/35 sm:block" />
        <p className="text-center text-sm font-semibold text-white">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-white hover:text-secondary">
            Log In
          </Link>
        </p>
        <div className="hidden h-px flex-1 bg-white/35 sm:block" />
      </div>
    </>
  )
}
