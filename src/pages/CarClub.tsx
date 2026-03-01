export function CarClub() {
  return (
    <div className="bg-black text-white">
      <section className="relative -mt-20 h-[88vh] min-h-[620px] max-h-[980px] overflow-hidden bg-black">
        <div className="absolute inset-0 flex items-start justify-center pt-8 md:pt-12">
          <div className="relative w-[min(920px,68vw)] min-w-[420px]">
            <img
              src="/Assets/Carclub Hero.png"
              alt="Fireball Car Club"
              className="h-auto w-full object-contain"
              draggable={false}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_62%,#000_100%)]" />
          </div>
        </div>

        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_46%,rgba(0,0,0,0.22)_72%,rgba(0,0,0,0.42)_100%)]" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(to_right,#000_0%,#000_60%,transparent_100%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(to_left,#000_0%,#000_60%,transparent_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.45)_52%,#000_100%)]" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-end justify-center px-6 pb-14 md:px-10 md:pb-20">
          <div className="max-w-5xl text-center">
            <h1 className="text-[clamp(2.8rem,8.5vw,7.2rem)] font-black uppercase tracking-[-0.02em] leading-[0.9] text-white [text-shadow:0_10px_24px_rgba(0,0,0,0.45)] [-webkit-text-stroke:0.35px_rgba(255,255,255,0.35)]">
              Where Passion Meets Privilege
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-white/80 md:text-base">
              Unlock premium benefits, exclusive rewards, and priority access designed for serious automotive owners.
            </p>
            <div className="mt-9">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-block px-8 py-3.5 font-nav font-bold text-sm uppercase rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#B61B1B', color: 'white' }}
              >
                Explore Membership
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black pb-24 pt-16 md:pt-20">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Section 2</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Membership benefits</h2>
          <p className="mt-4 max-w-2xl text-sm text-white/75 md:text-base">
            Cette section est volontairement placee juste sous le hero pour obtenir l'effet visuel avec la transition.
          </p>
        </div>
      </section>
    </div>
  )
}
