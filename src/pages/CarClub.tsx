import { useCallback, useContext, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { LenisContext } from '@/components/LenisRoot'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/usePageTitle'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1], delay },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  show: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.9, ease: 'easeOut', delay },
  }),
}

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const featureItem = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export function CarClub() {
  const { t } = useTranslation()
  const lenis = useContext(LenisContext)
  usePageTitle('Car Club - Fireball Canada')

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

  const ignitionFeatures = t('carClub.ignitionFeatures', { returnObjects: true }) as string[]
  const apexFeatures = t('carClub.apexFeatures', { returnObjects: true }) as string[]

  return (
    <div className="bg-black text-white">
      <section className="relative -mt-20 flex h-[88vh] min-h-[680px] max-h-[980px] flex-col overflow-hidden bg-black">
        {/* Hero image */}
        <motion.div
          className="absolute inset-0 flex items-start justify-center pt-8 md:pt-12"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative w-[min(920px,68vw)] min-w-[420px]">
            <img
              src="/Assets/Carclub Hero.png"
              alt="Fireball Car Club"
              className="h-auto w-full object-contain"
              draggable={false}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_62%,#000_100%)]" />
          </div>
        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.7)_50%,transparent_100%)]" />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_46%,rgba(0,0,0,0.22)_72%,rgba(0,0,0,0.42)_100%)]" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(to_right,#000_0%,#000_60%,transparent_100%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(to_left,#000_0%,#000_60%,transparent_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.45)_52%,#000_100%)]" />

        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col justify-end px-5 pb-32 pt-16 sm:px-6 md:pb-36">
          <div className="mx-auto flex w-full max-w-[90rem] flex-col-reverse gap-10 md:flex-row md:items-end md:justify-between md:gap-12">
            <motion.h1
              className="max-w-xl shrink-0 self-start pb-[0.15em] text-left font-nav text-4xl font-bold leading-[1.2] tracking-tight sm:text-5xl sm:leading-[1.18] md:max-w-lg md:text-6xl md:leading-[1.16] lg:text-7xl lg:leading-[1.14] bg-gradient-to-r from-[#d4d4d4] via-[#7a7a7a] to-[#1a1a1a] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]"
              variants={fadeUp}
              custom={0.35}
              initial="hidden"
              animate="show"
            >
              {t('carClub.heroTitle')}
            </motion.h1>
            <motion.div
              className="flex w-full shrink-0 flex-col items-end gap-6 text-right md:w-auto"
              variants={fadeUp}
              custom={0.55}
              initial="hidden"
              animate="show"
            >
              <p className="max-w-md text-pretty text-sm font-light leading-relaxed text-silver/80 md:text-base lg:text-lg">
                {t('carClub.heroSubtitle')}
              </p>
              <div className="flex flex-col items-end gap-1.5">
                <a
                  href="#membership"
                  onClick={scrollToMembershipCards}
                  className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}
                >
                  {t('carClub.exploreMembership')}
                </a>
                <p className="text-[11px] leading-tight text-silver/45">{t('carClub.heroPriceHint')}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="membership" className="scroll-mt-24 bg-black pb-24 pt-16 md:pt-20">
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
              <p className="text-white/90 font-semibold text-lg mb-2">{t('carClub.ignitionPrice')}</p>
              <p className="text-white/70 text-sm max-w-sm mb-6">
                {t('carClub.ignitionDesc')}
              </p>
              <motion.div
                className="flex flex-col gap-2.5 max-w-sm mx-auto mb-8"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                {ignitionFeatures.map((label) => (
                  <motion.div
                    key={label}
                    variants={featureItem}
                    className="bg-[#252525] border border-white/10 text-white px-3.5 py-2.5 rounded-[8px] text-xs flex items-center justify-start gap-2 w-full text-left"
                  >
                    <span className="text-white/70 text-sm select-none">+</span>
                    <span>{label}</span>
                  </motion.div>
                ))}
              </motion.div>
              <motion.a
                href="#"
                onClick={(e) => e.preventDefault()}
                className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                viewport={{ once: true }}
              >
                {t('carClub.joinIgnition')}
              </motion.a>
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
              <p className="text-white/90 font-semibold text-lg mb-2">{t('carClub.apexPrice')}</p>
              <p className="text-white/70 text-sm max-w-sm mb-6">
                {t('carClub.apexDesc')}
              </p>
              <motion.div
                className="flex flex-col gap-2.5 max-w-sm mx-auto mb-8"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                {apexFeatures.map((label) => (
                  <motion.div
                    key={label}
                    variants={featureItem}
                    className="bg-[#252525] border border-white/10 text-white px-3.5 py-2.5 rounded-[8px] text-xs flex items-center justify-start gap-2 w-full text-left"
                  >
                    <span className="text-red-400 text-sm select-none">+</span>
                    <span>{label}</span>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Link
                  to="/join-club?tier=apex"
                  className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}
                >
                  {t('carClub.upgradeToApex')}
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* VALUE JUSTIFICATION */}
          <motion.div
            className="border-t border-white/20 pt-16 pb-16"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h3 className="mx-auto max-w-3xl text-center font-nav text-2xl font-bold tracking-tight text-white md:text-4xl">
              {t('carClub.privilegeTitle')}
            </h3>
            <p className="mt-6 text-white/80 text-center max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              {t('carClub.privilegeDesc')}
              <br />
              <span className="font-semibold text-white/90">{t('carClub.privilegeHighlight')}</span>
            </p>
          </motion.div>

          {/* FINAL CTA */}
          <motion.div
            className="border-t border-white/20 pt-16 pb-8"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h3 className="text-center font-nav text-2xl font-bold tracking-tight text-white md:text-4xl">
              Join the Fireball Inner Circle
            </h3>
            <p className="mt-4 text-white/80 text-center max-w-xl mx-auto text-sm md:text-base">
              {t('carClub.joinCircleDesc')}
            </p>
            <motion.div
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              viewport={{ once: true }}
            >
              <Link
                to="/join-club?tier=apex"
                className="inline-block px-8 py-3.5 font-nav font-bold text-sm uppercase rounded-lg text-white transition-colors duration-200 hover:opacity-90"
                style={{ backgroundColor: '#B61B1B' }}
              >
                Become an Apex Member
              </Link>
              <Link
                to="/join-club?tier=ignition"
                className="inline-block px-8 py-3.5 font-nav font-bold text-sm uppercase rounded-lg border-2 border-white/60 text-white hover:border-white hover:bg-white/10 transition-all duration-300"
              >
                {t('carClub.startIgnition')}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
