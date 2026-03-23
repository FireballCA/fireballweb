import { Link } from 'react-router-dom'

export function ReserveYourSpot() {
  return (
    <section
      className="w-full border-t border-carbon-800 bg-carbon-950 px-6 py-16 text-white sm:px-10 sm:py-20 lg:px-16 lg:py-24"
      aria-labelledby="reserve-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-nav text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
          Invitations
        </p>
        <h2 id="reserve-heading" className="mt-4 font-nav text-3xl font-bold tracking-tight sm:text-4xl">
          Reserve your spot
        </h2>
        <p className="mt-5 text-sm leading-relaxed text-white/65 sm:text-base">
          This evening is private and capacity is limited. Reach out to request an invitation or ask questions —
          we’ll confirm details with you directly.
        </p>
        <Link
          to="/contact"
          className="mt-10 inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 font-nav text-sm font-bold text-carbon-900 transition-opacity hover:opacity-90"
        >
          Contact us
        </Link>
      </div>
    </section>
  )
}
