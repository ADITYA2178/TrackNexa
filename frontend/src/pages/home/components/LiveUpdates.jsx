export default function LiveUpdates() {
  return (
    <section className="rounded-3xl bg-[#F7F2E5] p-5 sm:p-6">
      <h2 className="font-heading text-2xl font-bold text-[#073936]">Live Updates</h2>
      <div className="mt-5 space-y-4">
        <div className="flex gap-3">
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-secondary" />
          <div>
            <p className="text-sm font-bold text-[#111827]">Boarding starts soon</p>
            <p className="text-sm text-slate">
              Coach positions will update 30 min before arrival.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#073936]" />
          <div>
            <p className="text-sm font-bold text-[#111827]">Route looks clear</p>
            <p className="text-sm text-slate">No major delays on this corridor.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
