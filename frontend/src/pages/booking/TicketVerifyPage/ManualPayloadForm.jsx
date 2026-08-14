const FIELDS = [
  { key: 'pnr', label: 'PNR', placeholder: '10-digit PNR' },
  { key: 'ref', label: 'Ticket ref', placeholder: 'TKT…' },
  { key: 'trn', label: 'Train no', placeholder: '12345' },
  { key: 'dt', label: 'Journey date', placeholder: 'YYYY-MM-DD' },
  { key: 'cls', label: 'Class', placeholder: 'SL / 3A / 2A' },
  { key: 'st', label: 'Status code', placeholder: 'CNF' },
]

export default function ManualPayloadForm({ manual, onUpdate }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <label
          key={field.key}
          className="flex flex-col rounded-2xl border-2 border-line bg-sky-mist px-4 py-3"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-deep">
            {field.label}
          </span>
          <input
            value={manual[field.key]}
            onChange={(event) => onUpdate(field.key, event.target.value)}
            placeholder={field.placeholder}
            className="mt-1 bg-transparent text-sm font-semibold text-charcoal outline-none placeholder:text-slate"
          />
        </label>
      ))}
      <label className="flex flex-col rounded-2xl border-2 border-line bg-sky-mist px-4 py-3 sm:col-span-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-deep">
          Signature
        </span>
        <textarea
          value={manual.sig}
          onChange={(event) => onUpdate('sig', event.target.value)}
          rows={3}
          spellCheck={false}
          placeholder="HMAC signature from QR"
          className="mt-1 resize-none bg-transparent font-mono text-xs font-semibold text-charcoal outline-none placeholder:text-slate"
        />
      </label>
    </div>
  )
}
