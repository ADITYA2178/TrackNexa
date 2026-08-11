export default function Dropdown({
  label,
  icon,
  options,
  value,
  onChange,
  className = '',
}) {
  return (
    <label className={`block rounded-xl border border-[#E4D7AD] px-4 py-3 ${className}`}>
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8E722B]">
        {icon}
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full cursor-pointer bg-transparent text-base font-semibold text-[#111827] outline-none"
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
