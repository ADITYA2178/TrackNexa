export default function PastePayloadForm({ pasteText, onChange }) {
  return (
    <label className="flex flex-col">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-deep">
        QR payload JSON
      </span>
      <textarea
        value={pasteText}
        onChange={(event) => onChange(event.target.value)}
        rows={10}
        spellCheck={false}
        placeholder={'{\n  "v": 1,\n  "pnr": "...",\n  "ref": "...",\n  "sig": "..."\n}'}
        className="mt-3 resize-y rounded-2xl border-2 border-line bg-sky-mist px-4 py-3 font-mono text-xs font-semibold text-charcoal outline-none focus:border-primary-deep sm:text-sm"
      />
    </label>
  )
}
