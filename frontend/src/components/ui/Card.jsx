export default function Card({ children, className = '' }) {
  return (
    <section
      className={`rounded-3xl border border-[#E9DFC0] bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {children}
    </section>
  )
}
