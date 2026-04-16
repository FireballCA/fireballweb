import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'
import { usePageTitle } from '@/hooks/usePageTitle'

export function JoinFireball() {
  usePageTitle('Join Fireball - Fireball Canada')
  return (
    <main className="bg-black text-white min-h-screen">
      {/* Hero : remonte sous navbar, ~90 % de la hauteur d'écran */}
      <section className="-mt-20">
        <div className="relative w-full min-h-[90vh]">
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

      {/* Section blanche plein écran sous le hero */}
      <section className="bg-white text-carbon-900 min-h-screen flex items-center">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="font-nav text-3xl font-bold tracking-tight text-carbon-900 md:text-4xl">
              Grow with the Fireball network.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-carbon-700 md:text-lg">
              Access certified training, product support, and a community of shops that take protection seriously.
              Turn your existing demand into a scalable, repeatable business with proven systems.
            </p>
          </div>
          <div className="mt-6 flex justify-start md:mt-0 md:justify-end">
            <SecondaryClipButton to="/join">Start your application</SecondaryClipButton>
          </div>
        </div>
      </section>
    </main>
  )
}
