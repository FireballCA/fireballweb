import { Link } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { cn } from '@/lib/utils'

export function Home() {
  usePageTitle('Fireball Canada')

  return (
    <main className="bg-carbon-950 text-white min-h-screen">
      <section
        className="relative flex h-[var(--app-hero-h)] min-h-[var(--app-hero-h)] flex-col overflow-hidden"
        aria-label="Hero"
      >
        <img
          src="/Assets/Carclub Hero.png"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/55" aria-hidden />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center px-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-silver/75">Fireball Canada</p>
          <h1 className="mt-4 font-nav text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            From Detail
            <br />
            To Perfection.
          </h1>
          <p className="mt-5 max-w-2xl text-sm text-silver/80 md:text-base">
            Crafted for those who demand precision, performance, and flawless results.
          </p>

          <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
            <Link
              to="/shop"
              className={cn('inline-flex w-full items-center justify-center', appleButtonVisualClassName)}
            >
              Explore products
            </Link>
            <Link
              to="/event"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15"
            >
              See events
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 text-carbon-900 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-nav text-3xl font-bold tracking-tight md:text-5xl">Shop by category</h2>
          <p className="mt-3 max-w-2xl text-sm text-carbon-600 md:text-base">
            Temporary stable layout. We will rebuild the full landing section by section.
          </p>
          <div className="mt-6">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-full border border-[#0485F7] bg-[#0485F7] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#3592F9] hover:bg-[#3592F9]"
            >
              Open shop
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-carbon-950 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-nav text-3xl font-bold tracking-tight md:text-5xl">Find your installer</h2>
          <p className="mt-3 max-w-2xl text-sm text-silver/75 md:text-base">
            Locate certified Fireball partners near you.
          </p>
          <div className="mt-6">
            <Link
              to="/find-installer"
              className={cn('inline-flex', appleButtonVisualClassName)}
            >
              Find installer
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
