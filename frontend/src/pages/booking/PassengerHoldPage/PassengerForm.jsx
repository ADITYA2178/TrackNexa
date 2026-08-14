import { BERTH_PREFERENCES, GENDER_OPTIONS } from '../../../api/bookings'

function FieldShell({ label, children }) {
  return (
    <label className="flex flex-col rounded-2xl border-2 border-line bg-white px-3 py-2.5 sm:px-4 sm:py-3">
      <span className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-deep">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputClassName =
  'w-full bg-transparent text-sm font-semibold text-charcoal outline-none placeholder:font-medium placeholder:text-slate sm:text-base'

export default function PassengerForm({ passengers, seatCount, onUpdate }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-deep">
            Step 3
          </p>
          <h2 className="font-heading text-xl font-bold sm:text-2xl">Who’s traveling?</h2>
          <p className="mt-1 text-sm text-slate">
            Fill details for {seatCount} passenger{seatCount === 1 ? '' : 's'}. Seats are
            auto-allocated on hold.
          </p>
        </div>
      </div>

      {passengers.map((passenger, index) => (
        <section
          key={`passenger-${index}`}
          className="rounded-3xl border-2 border-line bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-bold text-charcoal">
              Passenger {index + 1}
            </h3>
            <span className="rounded-full bg-sky-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-deep">
              Required
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldShell label="Full name">
                <input
                  value={passenger.fullName}
                  onChange={(event) => onUpdate(index, 'fullName', event.target.value)}
                  placeholder="As on ID proof"
                  className={inputClassName}
                  autoComplete="name"
                />
              </FieldShell>
            </div>

            <FieldShell label="Age">
              <input
                type="number"
                min={1}
                max={129}
                inputMode="numeric"
                value={passenger.age}
                onChange={(event) => onUpdate(index, 'age', event.target.value)}
                placeholder="Years"
                className={inputClassName}
              />
            </FieldShell>

            <FieldShell label="Gender">
              <select
                value={passenger.gender}
                onChange={(event) => onUpdate(index, 'gender', event.target.value)}
                className={inputClassName}
              >
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FieldShell>

            <div className="sm:col-span-2">
              <FieldShell label="Berth preference">
                <select
                  value={passenger.berthPreference}
                  onChange={(event) => onUpdate(index, 'berthPreference', event.target.value)}
                  className={inputClassName}
                >
                  {BERTH_PREFERENCES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldShell>
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
