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

        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.7)_50%,transparent_100%)]" />
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
                href="#membership"
                className="inline-block px-8 py-3.5 font-nav font-bold text-sm uppercase rounded-lg text-white transition-colors duration-200 hover:opacity-90"
                style={{ backgroundColor: '#B61B1B' }}
              >
                Explore Membership
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="membership" className="bg-black pb-24 pt-16 md:pt-20">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="flex justify-center pointer-events-none select-none">
            <p className="text-center text-[clamp(4rem,14vw,10rem)] font-black uppercase leading-[0.74] scale-y-[1.2] tracking-[-0.05em] bg-gradient-to-b from-white/[0.2] via-white/[0.08] to-transparent bg-clip-text text-transparent">
              MEMBERSHIP
            </p>
          </div>
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl text-center">Two Memberships. One Standard: Excellence.</h2>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 mt-12 mb-20">
            {/* CARTE GAUCHE — IGNITION MEMBER */}
            <div className="flex flex-col items-center text-center">
              <img
                src="/Assets/Fireball Ignition Membership.png"
                alt="Ignition Member card"
                className="w-full max-w-[400px] mx-auto h-auto object-contain mb-8"
                draggable={false}
              />
              <span className="text-xs font-nav font-bold uppercase tracking-widest text-white/50 mb-2">Core Access</span>
              <h3 className="font-display text-3xl text-white tracking-tight mb-1">Ignition Member</h3>
              <p className="text-white/90 font-semibold text-lg mb-2">$XX / year</p>
              <p className="text-white/70 text-sm max-w-sm mb-6">
                A refined entry into the Fireball ownership experience.
              </p>
              <div className="flex flex-col gap-2.5 max-w-sm mx-auto mb-8">
                {[
                  'Official Fireball digital member card',
                  'Exclusive member-only pricing',
                  'Access to Fireball Car Club platform',
                  'Certified installer network access',
                  'Priority product availability over public releases',
                  'Early announcements & private updates',
                ].map((label) => (
                  <div
                    key={label}
                    className="bg-[#252525] border border-white/10 text-white px-3.5 py-2.5 rounded-[8px] text-xs flex items-center justify-start gap-2 w-full text-left"
                  >
                    <span className="text-white/70 text-sm select-none">+</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-block px-6 py-3 font-nav font-bold text-sm uppercase rounded-lg border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300"
              >
                Join Ignition
              </a>
            </div>

            {/* CARTE DROITE — APEX MEMBER (Premium) */}
            <div className="flex flex-col items-center text-center">
              <img
                src="/Assets/Fireball Apex Membership.png"
                alt="Apex Member card"
                className="w-full max-w-[400px] mx-auto h-auto object-contain mb-8"
                draggable={false}
              />
              <span className="text-xs font-nav font-bold uppercase tracking-widest text-apex mb-2">Elite Tier</span>
              <h3 className="font-display text-3xl text-white tracking-tight mb-1">Apex Member</h3>
              <p className="text-white/90 font-semibold text-lg mb-2">$XXX / year</p>
              <p className="text-white/70 text-sm max-w-sm mb-6">
                The highest level of access. Reserved for those who accept nothing less.
              </p>
              <div className="flex flex-col gap-2.5 max-w-sm mx-auto mb-8">
                {[
                  '$100 annual product credit',
                  'Exclusive Apex-only discounts',
                  'Priority access to limited inventory',
                  'Premium black Apex digital card',
                  'Early access to unreleased technologies',
                  'Invitations to private Fireball events',
                  'Elevated status within the Fireball ecosystem',
                ].map((label) => (
                  <div
                    key={label}
                    className="bg-[#252525] border border-white/10 text-white px-3.5 py-2.5 rounded-[8px] text-xs flex items-center justify-start gap-2 w-full text-left"
                  >
                    <span className="text-red-400 text-sm select-none">+</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-block px-6 py-3 font-nav font-bold text-sm uppercase rounded-lg text-white transition-colors duration-200 hover:opacity-90"
                style={{ backgroundColor: '#B61B1B' }}
              >
                Upgrade to Apex
              </a>
            </div>
          </div>

          {/* VALUE JUSTIFICATION */}
          <div className="border-t border-white/20 pt-16 pb-16">
            <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight text-center max-w-3xl mx-auto">
              Apex Is Not an Upgrade. It&apos;s a Privilege.
            </h3>
            <p className="mt-6 text-white/80 text-center max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Apex Membership includes a $100 annual product credit, meaning it begins paying for itself immediately — before even considering exclusive pricing, priority access, and elite-level benefits.
              <br />
              <span className="font-semibold text-white/90">This tier exists for owners who demand more.</span>
            </p>
          </div>

          {/* FINAL CTA */}
          <div className="border-t border-white/20 pt-16 pb-8">
            <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight text-center">
              Join the Fireball Inner Circle
            </h3>
            <p className="mt-4 text-white/80 text-center max-w-xl mx-auto text-sm md:text-base">
              Membership is not about access.<br />
              It&apos;s about alignment with the highest standards in automotive protection.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-block px-8 py-3.5 font-nav font-bold text-sm uppercase rounded-lg text-white transition-colors duration-200 hover:opacity-90"
                style={{ backgroundColor: '#B61B1B' }}
              >
                Become an Apex Member
              </a>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-block px-8 py-3.5 font-nav font-bold text-sm uppercase rounded-lg border-2 border-white/60 text-white hover:border-white hover:bg-white/10 transition-all duration-300"
              >
                Start with Ignition
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
