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
    title: 'Tarifs revendeur exclusifs',
    body: "En tant que partenaire Fireball, vous accédez aux produits à des prix professionnels réservés aux revendeurs certifiés — une marge compétitive que vos clients ne trouveront pas ailleurs.",
  },
  {
    Icon: IconSchool,
    stat: '100%',
    statLabel: 'formation incluse',
    title: 'Formation et certification officielle',
    body: "Chaque partenaire reçoit une formation complète sur les produits Fireball : application, vente, et positionnement. Vous repartez certifié, crédible, et prêt à conclure.",
  },
  {
    Icon: IconTrendingUp,
    stat: 'ROI',
    statLabel: 'dès le départ',
    title: 'Un modèle rentable dès le premier client',
    body: "Le programme est conçu pour que votre investissement se rentabilise rapidement. Fireball vous donne les outils, les prix, et le support pour générer des revenus réels.",
  },
  {
    Icon: IconUsers,
    stat: 'Réseau',
    statLabel: 'de partenaires',
    title: 'Accès à une communauté de pros',
    body: "Rejoignez un réseau de détailleurs et installateurs certifiés à travers le Canada. Partagez des références, des conseils, et grandissez avec des gens qui comprennent votre réalité.",
  },
  {
    Icon: IconHeadset,
    stat: '1:1',
    statLabel: 'support dédié',
    title: "Support direct de l’équipe Fireball",
    body: "Vous n'êtes jamais seul. L'équipe Fireball est disponible pour vous accompagner sur les produits, les techniques, et les défis de votre business — en temps réel.",
  },
  {
    Icon: IconRosette,
    stat: 'Marque',
    statLabel: 'reconnue',
    title: "La force d'une marque établie",
    body: "Vendre Fireball, c'est vendre une marque que les clients recherchent. Un nom, une réputation, et des produits qui parlent d'eux-mêmes — du premium que vous pouvez défendre avec confiance.",
  },
]

export function JoinFireball() {
  usePageTitle('Rejoindre Fireball — Fireball Canada')

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
            src="/join-fireball-hero.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/65" aria-hidden />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-20 pb-10 text-center">
            <p className="jf-reveal mb-5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50">
              Programme Revendeur
            </p>
            <h1 className="jf-reveal font-nav text-4xl font-black leading-[1.04] tracking-tight text-white md:text-6xl lg:text-7xl mb-6">
              Devenez revendeur<br />Fireball.
            </h1>
            <p className="jf-reveal max-w-xl text-base leading-relaxed text-white/65 md:text-lg" style={{ fontWeight: 300 }}>
              Accédez aux produits, à la formation, et au réseau d'une marque premium — et bâtissez un business sur des bases solides.
            </p>
            <div className="jf-reveal mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <a href="/join" className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}>
                Soumettre ma candidature
              </a>
              <SecondaryClipButton
                href="#pourquoi"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('pourquoi')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                En savoir plus
              </SecondaryClipButton>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section id="pourquoi" className="bg-white py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6 md:px-16">
            <p className="jf-reveal mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-carbon-500">
              Pourquoi rejoindre Fireball
            </p>
            <h2 className={cn('jf-reveal text-carbon-900 mb-5', landingSectionTitle)}>
              Plus qu'un fournisseur.<br />Un vrai partenariat.
            </h2>
            <p className="jf-reveal max-w-2xl text-base leading-relaxed text-carbon-600 md:text-lg" style={{ fontWeight: 300 }}>
              Fireball ne vend pas simplement des produits à ses revendeurs. On bâtit ensemble un réseau de professionnels certifiés qui représentent la marque avec fierté — et qui en tirent une valeur concrète au quotidien.
            </p>
          </div>
        </section>

        {/* Benefits cards — style Academy */}
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
              Prêt à rejoindre le réseau ?
            </h2>
            <p className="jf-reveal mx-auto mb-10 max-w-xl text-base leading-relaxed text-carbon-600 md:text-lg" style={{ fontWeight: 300 }}>
              Remplissez le formulaire de candidature — notre équipe vous contacte personnellement dans les 3 à 5 jours ouvrables pour discuter de votre projet.
            </p>
            <div className="jf-reveal">
              <a href="/join" className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}>
                Soumettre ma candidature
              </a>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
