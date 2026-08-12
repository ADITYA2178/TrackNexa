export default function Dropdown({
  label,
  icon,
  options,
  value,
  onChange,
  className = '',
}) {
  return (
    <label className={`flex flex-1 flex-col rounded-2xl border-2 border-line bg-white px-4 py-3 ${className}`}>
      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary-deep">
        {icon}
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full cursor-pointer bg-transparent text-base font-semibold text-charcoal outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
