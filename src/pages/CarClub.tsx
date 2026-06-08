import { useCallback, useContext, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { IconChevronDown } from '@tabler/icons-react'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { LenisContext } from '@/components/LenisRoot'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SEO, breadcrumbJsonLd } from '@/components/SEO'

const EASE_SPRING = [0.22, 1, 0.36, 1] as [number, number, number, number]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: EASE_SPRING, delay },
  }),
} as const as import('framer-motion').Variants

const fadeIn = {
  hidden: { opacity: 0 },
  show: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.9, ease: 'easeOut' as const, delay },
  }),
} as const as import('framer-motion').Variants

function CarClubFAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="pr-6 text-sm font-semibold text-white md:text-base">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
          <IconChevronDown size={16} className="text-white/40" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-white/60">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function CarClub() {
  const { t } = useTranslation()
  const lenis = useContext(LenisContext)
  usePageTitle('Car Club - Fireball Canada')

  const carClubFaqs = t('carClub.faqs', { returnObjects: true }) as Array<{ q: string; a: string }>

  const featuresComingSoonLabel = t('carClub.featuresComingSoon')
  const launchSoonLabel = t('carClub.launchSoon')

  const scrollToMembershipCards = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      const el = document.getElementById('membership')
      if (!el) return
      if (lenis) {
        lenis.scrollTo(el, { offset: -96, duration: 1.15 })
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    [lenis],
  )

  return (
    <>
      <SEO
        title="Fireball Car Club — Canada's Premier Detailing Community"
        description="Join the Fireball Car Club — exclusive events, ceramic coating perks, member rewards and Canada's most passionate community of automotive detailing enthusiasts."
        canonicalPath="/car-club"
        keywords="Fireball Car Club, Canadian car club, detailing community, automotive enthusiasts Canada, ceramic coating club, car shows Canada"
        jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Car Club', path: '/car-club' }])}
      />
      <div className="bg-black text-white">
      <section
        className={cn(
          'relative flex flex-col overflow-hidden bg-black',
          'max-md:h-[min(78dvh,var(--app-hero-h))] max-md:min-h-[min(78dvh,var(--app-hero-h))]',
          'md:h-[min(88vh,var(--app-hero-h))] md:min-h-[min(680px,var(--app-hero-h))] md:max-h-[var(--app-hero-h)]',
        )}
      >
        {/* Hero image */}
        <motion.div
          className="absolute inset-0 flex items-start justify-center pt-2 max-md:opacity-[0.92] md:pt-12"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative w-[min(920px,68vw)] min-w-[min(100%,420px)] max-md:min-w-0 max-md:w-[min(88vw,920px)]">
            <img
              src="/Assets/Carclub Hero.png"
              alt="Fireball Car Club"
              className="h-auto w-full object-contain"
              draggable={false}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_50%,rgba(0,0,0,0.85)_100%)] md:hidden" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-32 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_62%,#000_100%)] md:block" />
          </div>
        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0.08)_42%,transparent_100%)] md:h-40 md:bg-[linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.7)_50%,transparent_100%)]" />
        <div className="absolute inset-0 bg-black/[0.06] md:bg-black/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_42%,rgba(0,0,0,0.12)_72%,rgba(0,0,0,0.28)_100%)] md:bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_46%,rgba(0,0,0,0.22)_72%,rgba(0,0,0,0.42)_100%)]" />
        {/* Bandes latérales : masquées au mobile pour laisser respirer un hero centré type Academy */}
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 bg-[linear-gradient(to_right,#000_0%,#000_60%,transparent_100%)] md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(to_left,#000_0%,#000_60%,transparent_100%)] md:block" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_42%,rgba(0,0,0,0.82)_100%)] md:h-64 md:bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.45)_52%,#000_100%)]" />

        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col justify-center px-5 pb-10 pt-12 sm:px-6 md:justify-end md:pb-36 md:pt-16">
          <div className="mx-auto flex w-full max-w-[90rem] flex-col items-center gap-6 text-center md:flex-row md:items-end md:justify-between md:gap-12 md:text-left">
            <motion.h1
              className="max-w-xl shrink-0 pb-[0.15em] font-nav text-[clamp(1.85rem,6.5vw,2.25rem)] font-bold leading-[1.15] tracking-tight text-balance sm:text-5xl sm:leading-[1.18] md:max-w-lg md:self-start md:text-6xl md:leading-[1.16] lg:text-7xl lg:leading-[1.14] bg-gradient-to-r from-[#d4d4d4] via-[#7a7a7a] to-[#1a1a1a] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]"
              variants={fadeUp}
              custom={0.35}
              initial="hidden"
              animate="show"
            >
              {t('carClub.heroTitle')}
            </motion.h1>
            <motion.div
              className="flex w-full max-w-lg shrink-0 flex-col items-center gap-4 text-center md:max-w-none md:w-auto md:items-end md:gap-6 md:text-right"
              variants={fadeUp}
              custom={0.55}
              initial="hidden"
              animate="show"
            >
              <p className="mx-auto max-w-md text-pretty text-sm font-light leading-relaxed text-silver/85 md:mx-0 md:text-base lg:text-lg">
                {t('carClub.heroSubtitle')}
              </p>
              <div className="flex flex-col items-center gap-1.5 md:items-end">
                <a
                  href="#membership"
                  onClick={scrollToMembershipCards}
                  className={cn(appleButtonVisualClassName, 'inline-flex justify-center')}
                >
                  {t('carClub.exploreMembership')}
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="membership" className="scroll-mt-24 bg-black pb-24 pt-8 md:pt-20">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <motion.div
            className="flex justify-center pointer-events-none select-none"
            variants={fadeIn}
            custom={0}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
          >
            <p className="text-center text-[clamp(4rem,14vw,10rem)] font-black uppercase leading-[0.74] scale-y-[1.2] tracking-[-0.05em] bg-gradient-to-b from-white/[0.2] via-white/[0.08] to-transparent bg-clip-text text-transparent">
              MEMBERSHIP
            </p>
          </motion.div>
          <motion.h2
            className="mt-3 text-center font-nav text-4xl font-bold tracking-tight text-white md:text-6xl"
            variants={fadeUp}
            custom={0.1}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
          >
            <span className="block text-balance">{t('carClub.membershipTitleLead')}</span>
            <span className="mt-2 block bg-gradient-to-r from-[#d4d4d4] via-[#7a7a7a] to-[#1a1a1a] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">
              {t('carClub.membershipTitleHighlight')}
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 mt-12 mb-20">
            {/* CARTE GAUCHE — IGNITION MEMBER */}
            <motion.div
              className="flex flex-col items-center text-center"
              variants={fadeUp}
              custom={0}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.img
                src="/Assets/Fireball Ignition Membership.png"
                alt="Ignition Member card"
                className="w-full max-w-[400px] mx-auto h-auto object-contain mb-8"
                draggable={false}
                initial={{ opacity: 0, y: 24, rotateY: -6 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, amount: 0.3 }}
              />
              <span className="text-xs font-nav font-bold uppercase tracking-widest text-white/50 mb-2">{t('carClub.coreAccess')}</span>
              <h3 className="font-nav text-3xl font-bold text-white tracking-tight mb-1">{t('carClub.ignitionMember')}</h3>
              <p className="text-white/70 text-sm max-w-sm mb-6 mt-2">
                {t('carClub.ignitionDesc')}
              </p>
              <p className="mb-8 max-w-sm mx-auto text-sm text-white/50">
                {featuresComingSoonLabel}
              </p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                viewport={{ once: true }}
              >
                <button
                  type="button"
                  disabled
                  className={cn('inline-flex whitespace-nowrap cursor-not-allowed opacity-70', appleButtonVisualClassName)}
                >
                  {launchSoonLabel}
                </button>
              </motion.div>
            </motion.div>

            {/* CARTE DROITE — APEX MEMBER (Premium) */}
            <motion.div
              className="flex flex-col items-center text-center"
              variants={fadeUp}
              custom={0.15}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.img
                src="/Assets/Fireball Apex Membership.png"
                alt="Apex Member card"
                className="w-full max-w-[400px] mx-auto h-auto object-contain mb-8"
                draggable={false}
                initial={{ opacity: 0, y: 24, rotateY: 6 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
                viewport={{ once: true, amount: 0.3 }}
              />
              <span className="text-xs font-nav font-bold uppercase tracking-widest text-apex mb-2">{t('carClub.eliteTier')}</span>
              <h3 className="font-nav text-3xl font-bold text-white tracking-tight mb-1">{t('carClub.apexMember')}</h3>
              <p className="text-white/70 text-sm max-w-sm mb-6 mt-2">
                {t('carClub.apexDesc')}
              </p>
              <p className="mb-8 max-w-sm mx-auto text-sm text-white/50">
                {featuresComingSoonLabel}
              </p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                viewport={{ once: true }}
              >
                <button
                  type="button"
                  disabled
                  className={cn('inline-flex whitespace-nowrap cursor-not-allowed opacity-70', appleButtonVisualClassName)}
                >
                  {launchSoonLabel}
                </button>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0a0a0a] py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-[280px_1fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                {t('carClub.faqTitle')}
              </h2>
              <p className="mt-2 text-sm text-white/50">
                {t('carClub.faqSubtitle')}
              </p>
            </div>
            <div className="border-t border-white/10">
              {carClubFaqs.map((f, i) => (
                <CarClubFAQItem key={i} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
