import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

function CalendarDropdown({ options = [], value, onChange, disabled, 'aria-label': ariaLabel }) {
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((option) => String(option.value) === String(value))

  const chooseOption = (option) => {
    onChange?.({ target: { value: String(option.value) } })
    setOpen(false)
  }

  return (
    <div className="relative min-w-24">
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#E4D7AD] bg-white px-3 py-2 text-sm font-semibold text-[#073936] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{selectedOption?.label}</span>
        <span className="text-xs text-[#8E722B]">v</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.25rem)] z-[70] max-h-[320px] w-max min-w-full overflow-y-auto rounded-xl border border-[#E4D7AD] bg-white py-1 shadow-2xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => chooseOption(option)}
              className="block w-full whitespace-nowrap px-3 py-2 text-left text-sm text-[#111827] hover:bg-[#F7EAC2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function DatePickerField({ label, icon, value, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const displayValue = value
    ? value.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Select date'

  return (
    <div className={`relative z-30 rounded-xl border border-[#E4D7AD] px-4 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full text-left"
      >
        <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8E722B]">
          {icon}
          {label}
        </span>
        <span className="text-base font-semibold text-[#111827]">{displayValue}</span>
      </button>

      {open ? (
        <div className="absolute left-1/2 top-[calc(100%+0.5rem)] z-50 max-h-[420px] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-[#E4D7AD] bg-white p-3 text-[#111827] shadow-2xl sm:left-0 sm:translate-x-0">
          <DayPicker
            mode="single"
            selected={value}
            captionLayout="dropdown"
            navLayout="around"
            startMonth={new Date(1970, 0)}
            endMonth={new Date(2200, 11)}
            components={{ Dropdown: CalendarDropdown }}
            onSelect={(date) => {
              if (!date) return
              onChange(date)
              setOpen(false)
            }}
            footer={false}
          />
        </div>
      ) : null}
    </div>
  )
}
