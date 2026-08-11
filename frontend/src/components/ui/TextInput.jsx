export default function TextInput({
  label,
  icon,
  className = '',
  inputClassName = '',
  ...props
}) {
  return (
    <label className={`block rounded-xl border border-[#E4D7AD] px-4 py-3 ${className}`}>
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8E722B]">
        {icon}
        {label}
      </span>
      <input
        className={`w-full bg-transparent text-base font-semibold text-[#111827] outline-none placeholder:text-slate/70 ${inputClassName}`}
        {...props}
      />
    </label>
  )
}
