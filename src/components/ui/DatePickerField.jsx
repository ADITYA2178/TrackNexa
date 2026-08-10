import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

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
        <div className="absolute left-1/2 top-[calc(100%+0.5rem)] z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-[#E4D7AD] bg-white p-3 text-[#111827] shadow-2xl sm:left-0 sm:translate-x-0">
          <DayPicker
            mode="single"
            selected={value}
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
