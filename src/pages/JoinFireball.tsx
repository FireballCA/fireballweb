import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'

export function JoinFireball() {
  return (
    <section className="min-h-screen bg-black">
      <div className="relative w-full min-h-[92vh]">
        <img
          src="/join-fireball-hero.jpg"
          alt="Join Fireball"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/20" aria-hidden />

        <div className="relative z-10 h-full w-full flex items-center justify-center px-6 pt-20 pb-10">
          <div className="w-full max-w-3xl text-center">
            <h1 className="font-nav font-bold text-4xl md:text-6xl tracking-tight text-white">
              Join Fireball
            </h1>
            <p className="mt-4 text-silver/80 text-lg md:text-xl max-w-2xl mx-auto">
              Build more than a business
            </p>

            <div className="mt-10 flex items-center justify-center">
              <SecondaryClipButton to="/join">Apply now</SecondaryClipButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
