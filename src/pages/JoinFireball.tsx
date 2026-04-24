import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/usePageTitle'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'
import {
  IconBuildingStore,
  IconUsers,
  IconSchool,
  IconTrendingUp,
  IconHeadset,
  IconRosette,
} from '@tabler/icons-react'

const featureIconCircleClass =
  'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-carbon-900'

const landingSectionTitle = 'font-sans text-3xl font-bold tracking-tight md:text-5xl'

const benefits = [
  {
    Icon: IconBuildingStore,
    stat: 'Pro',
    statLabel: 'pricing access',
    title: 'Exclusive reseller pricing',
    body: 'As a Fireball partner, you get access to professional pricing reserved for certified resellers — a competitive margin your clients cannot find anywhere else.',
  },
  {
    Icon: IconSchool,
    stat: '100%',
    statLabel: 'hands-on training',
    title: 'Official training & certification',
    body: 'Every partner goes through a full Fireball product training: application, sales, and positioning. You leave certified, credible, and ready to close.',
  },
  {
    Icon: IconTrendingUp,
    stat: 'ROI',
    statLabel: 'from day one',
    title: 'A model that pays off fast',
    body: 'The program is built so your investment returns quickly. Fireball gives you the tools, pricing, and support to generate real revenue from your first client.',
  },
  {
    Icon: IconUsers,
    stat: 'Network',
    statLabel: 'of professionals',
    title: 'Access to a community of pros',
    body: 'Join a network of certified detailers and installers across Canada. Share referrals, advice, and grow alongside people who understand what you do.',
  },
  {
    Icon: IconHeadset,
    stat: '1:1',
    statLabel: 'dedicated support',
    title: 'Direct support from the Fireball team',
    body: "You're never on your own. The Fireball team is available to help you with products, techniques, and business challenges — in real time.",
  },
  {
    Icon: IconRosette,
    stat: 'Brand',
    statLabel: 'clients trust',
    title: 'The strength of an established brand',
    body: 'Selling Fireball means selling a brand clients actively seek out. A name, a reputation, and products that speak for themselves — premium you can stand behind.',
  },
]

export function JoinFireball() {
  usePageTitle('Join Fireball — Fireball Canada')

  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>('.jf-reveal')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('jf-visible')
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )
    reveals.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <style>{`
        .jf-reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .jf-reveal.jf-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <main className="bg-white text-carbon-900 min-h-screen">

        {/* Hero */}
        <section className="relative -mt-20 flex h-[88dvh] min-h-[88dvh] flex-col overflow-hidden">
          <img
            src="/join-fireball-team.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/65" aria-hidden />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-20 pb-10 text-center">
            <h1 className="jf-reveal font-nav text-4xl font-black leading-[1.04] tracking-tight text-white md:text-6xl lg:text-7xl mb-6">
              Build more than<br />a business.
            </h1>
            <p className="jf-reveal max-w-xl text-base leading-relaxed text-white/65 md:text-lg" style={{ fontWeight: 300 }}>
              Join a network of certified professionals and grow with the products, training, and support of a brand people trust.
            </p>
            <div className="jf-reveal mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <a href="/join" className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}>
                Apply now
              </a>
              <SecondaryClipButton
                href="#why"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('why')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Learn more
              </SecondaryClipButton>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section id="why" className="bg-white py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6 md:px-16">
            <h2 className={cn('jf-reveal text-carbon-900 mb-5', landingSectionTitle)}>
              More than a supplier.<br />A real partnership.
            </h2>
            <p className="jf-reveal max-w-2xl text-base leading-relaxed text-carbon-600 md:text-lg" style={{ fontWeight: 300 }}>
              Fireball does not just sell products to its resellers. We build a network of certified professionals who represent the brand with pride — and get real, tangible value out of it every day.
            </p>
          </div>
        </section>

        {/* Benefits cards */}
        <section className="bg-white pb-24 md:pb-32">
          <div className="mx-auto max-w-7xl px-6 md:px-16">
            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              {benefits.map((item, idx) => {
                const FeatureIcon = item.Icon
                return (
                  <div
                    key={idx}
                    className="jf-reveal rounded-2xl border border-carbon-900/10 bg-pearl p-6 shadow-sm md:p-7"
                    style={{ transitionDelay: `${(idx % 2) * 0.08}s` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className={featureIconCircleClass} aria-hidden>
                        <FeatureIcon className="h-6 w-6" stroke={1.75} />
                      </span>
                      <div className="min-w-0 text-right">
                        <p
                          className="font-nav text-3xl font-black tabular-nums tracking-tight text-carbon-900 md:text-4xl"
                          style={{ fontFamily: "'Roboto', sans-serif" }}
                        >
                          {item.stat}
                        </p>
                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-carbon-500">
                          {item.statLabel}
                        </p>
                      </div>
                    </div>
                    <h3
                      className="mt-6 text-left text-xl font-bold text-carbon-900 md:text-[1.35rem]"
                      style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700 }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="mt-3 text-left text-base leading-relaxed text-carbon-600"
                      style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}
                    >
                      {item.body}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-carbon-900/8 bg-[#f7f7f7] py-24 md:py-32">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className={cn('jf-reveal text-carbon-900 mb-5', landingSectionTitle)}>
              Ready to join the network?
            </h2>
            <p className="jf-reveal mx-auto mb-10 max-w-xl text-base leading-relaxed text-carbon-600 md:text-lg" style={{ fontWeight: 300 }}>
              Fill out the application form — our team will reach out personally within 3 to 5 business days to talk about your project.
            </p>
            <div className="jf-reveal">
              <a href="/join" className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}>
                Apply now
              </a>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
