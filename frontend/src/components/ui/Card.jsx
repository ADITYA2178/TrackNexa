export default function Card({ children, className = '' }) {
  return (
    <section
      className={`rounded-3xl border-2 border-line bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {children}
    </section>
  )
}
