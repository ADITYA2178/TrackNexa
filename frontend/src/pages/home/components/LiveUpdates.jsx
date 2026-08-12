export default function LiveUpdates() {
  return (
    <section className="flex flex-col rounded-3xl bg-sky-soft p-5 sm:p-6">
      <h2 className="font-heading text-2xl font-bold text-charcoal">Live Updates</h2>
      <div className="mt-5 flex flex-col gap-4">
        <div className="flex gap-3">
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-secondary" />
          <div className="flex flex-col">
            <p className="text-sm font-bold text-charcoal">Boarding starts soon</p>
            <p className="text-sm text-slate">
              Coach positions will update 30 min before arrival.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
          <div className="flex flex-col">
            <p className="text-sm font-bold text-charcoal">Route looks clear</p>
            <p className="text-sm text-slate">No major delays on this corridor.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
