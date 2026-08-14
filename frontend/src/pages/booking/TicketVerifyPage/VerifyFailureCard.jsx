export default function VerifyFailureCard({ failure }) {
  return (
    <section className="rounded-3xl border-2 border-[#F3B4B4] bg-[#FFF5F5] px-4 py-5 sm:px-5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A3A3A]">
        Not valid
      </p>
      <h2 className="mt-2 font-heading text-xl font-bold text-charcoal">Verification failed</h2>
      <p className="mt-2 text-sm text-slate">{failure.message}</p>
      {failure.code ? (
        <p className="mt-2 font-mono text-xs font-semibold text-[#8A3A3A]">
          {failure.code}
          {failure.fields?.length ? ` · ${failure.fields.join(', ')}` : ''}
        </p>
      ) : null}
    </section>
  )
}
