export default function TextInput({
  label,
  icon,
  className = '',
  inputClassName = '',
  ...props
}) {
  return (
    <label className={`flex flex-1 flex-col rounded-2xl border-2 border-line bg-white px-4 py-3 ${className}`}>
      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary-deep">
        {icon}
        {label}
      </span>
      <input
        className={`w-full bg-transparent text-base font-semibold text-charcoal outline-none placeholder:font-medium placeholder:text-slate ${inputClassName}`}
        {...props}
      />
    </label>
  )
}
