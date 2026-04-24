import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'
import { cn } from '@/lib/utils'

/* ─── inline styles ──────────────────────────────────────────────────── */
const globalCss = `
  @keyframes jf-fade-up {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes jf-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes jf-line-grow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes jf-count {
    from { --n: 0; }
    to   { --n: var(--target); }
  }
  .jf-reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
  }
  .jf-reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .jf-reveal-fade {
    opacity: 0;
    transition: opacity 1s ease;
  }
  .jf-reveal-fade.visible {
    opacity: 1;
  }
  .jf-line {
    transform-origin: left;
    transform: scaleX(0);
    transition: transform 1.1s cubic-bezier(0.16,1,0.3,1);
  }
  .jf-line.visible {
    transform: scaleX(1);
  }
  .jf-card {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, background 0.3s ease;
  }
  .jf-card.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .jf-card:hover {
    border-color: rgba(212,43,43,0.35) !important;
    background: rgba(212,43,43,0.04) !important;
  }
  .jf-stat-num {
    font-variant-numeric: tabular-nums;
  }
  .jf-hero-line {
    animation: jf-fade-up 1.2s cubic-bezier(0.16,1,0.3,1) both;
  }
  .jf-hero-sub {
    animation: jf-fade-up 1.2s cubic-bezier(0.16,1,0.3,1) 0.18s both;
  }
  .jf-hero-cta {
    animation: jf-fade-up 1.2s cubic-bezier(0.16,1,0.3,1) 0.34s both;
  }
  .jf-hero-badge {
    animation: jf-fade-in 1.4s ease 0.5s both;
  }
  .jf-ticker-track {
    display: flex;
    gap: 4rem;
    animation: jf-ticker 28s linear infinite;
    white-space: nowrap;
  }
  @keyframes jf-ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .jf-pillar-icon {
    transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  .jf-card:hover .jf-pillar-icon {
    transform: scale(1.12);
  }
  .jf-step-num {
    transition: color 0.3s ease;
  }
  .jf-step:hover .jf-step-num {
    color: #d42b2b;
  }
`

/* ─── data ──────────────────────────────────────────────────────────── */
const pillars = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    label: 'Business',
    headline: 'Scale with proven systems.',
    body: 'Access Fireball\'s operational frameworks, pricing structures, and sales methodology — built for shops that want repeatable, profitable growth.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/><path d="M14 14h3v3"/><path d="M10 10H7V7"/>
      </svg>
    ),
    label: 'Network',
    headline: 'Connect with the best.',
    body: 'Join a curated network of elite detailers, coating specialists, and industry leaders across Canada who share standards, referrals, and opportunities.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    label: 'Training',
    headline: 'Master your craft.',
    body: 'Exclusive access to live certification sessions, product deep-dives, and installation technique workshops — designed for professionals who demand precision.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    label: 'Support',
    headline: 'Never navigate alone.',
    body: 'Dedicated partner support, direct access to the Fireball team, and a community ready to troubleshoot, advise, and elevate alongside you.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
    label: 'Growth',
    headline: 'Build something lasting.',
    body: 'From your first coating install to running a multi-bay operation — Fireball\'s ecosystem evolves with you at every stage of your business journey.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
    label: 'Legacy',
    headline: 'Stand for something more.',
    body: 'Fireball partners don\'t just run shops — they set the standard. Carry a brand that clients recognize, trust, and come back to, year after year.',
  },
]

const stats = [
  { value: 40, suffix: '+', label: 'Certified Partners' },
  { value: 8, suffix: ' yrs', label: 'Industry Experience' },
  { value: 100, suffix: 'k+', label: 'Vehicles Protected' },
  { value: 3, suffix: 'x', label: 'Avg. Revenue Growth' },
]

const steps = [
  { num: '01', title: 'Apply', desc: 'Fill out a short application. Tell us about your shop, your goals, and what drives you to pursue excellence.' },
  { num: '02', title: 'Discovery Call', desc: 'A member of the Fireball team connects with you personally — no pitch decks, just an honest conversation about fit.' },
  { num: '03', title: 'Onboarding', desc: 'Receive your starter kit, complete your certification, and get introduced to the partner network.' },
  { num: '04', title: 'Elevate', desc: 'Activate your Fireball presence, access exclusive pricing, and begin building the business you envisioned.' },
]

const ticker = [
  'Ceramic Coating', 'PPF Installation', 'Window Tint', 'Paint Correction',
  'Detailing Excellence', 'Business Growth', 'Certified Training', 'Elite Network',
  'Ceramic Coating', 'PPF Installation', 'Window Tint', 'Paint Correction',
  'Detailing Excellence', 'Business Growth', 'Certified Training', 'Elite Network',
]

/* ─── component ─────────────────────────────────────────────────────── */
export function JoinFireball() {
  usePageTitle('Join Fireball — Fireball Canada')
  const styleInjected = useRef(false)

  useEffect(() => {
    if (!styleInjected.current) {
      styleInjected.current = true
      const tag = document.createElement('style')
      tag.textContent = globalCss
      document.head.appendChild(tag)
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )

    const targets = document.querySelectorAll('.jf-reveal, .jf-reveal-fade, .jf-line, .jf-card, .jf-step')
    targets.forEach((el) => obs.observe(el))

    /* Stagger cards */
    const cards = document.querySelectorAll<HTMLElement>('.jf-card')
    cards.forEach((card, i) => {
      card.style.transitionDelay = `${i * 0.07}s`
    })

    /* Stagger steps */
    const stepsEls = document.querySelectorAll<HTMLElement>('.jf-step')
    stepsEls.forEach((el, i) => {
      el.style.transitionDelay = `${i * 0.1}s`
    })

    /* Animated counters */
    const counters = document.querySelectorAll<HTMLElement>('[data-count]')
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        const el = e.target as HTMLElement
        const target = parseInt(el.dataset.count ?? '0', 10)
        const duration = 1800
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1)
          const ease = 1 - Math.pow(1 - t, 3)
          el.textContent = Math.round(ease * target).toString()
          if (t < 1) requestAnimationFrame(tick)
          else el.textContent = target.toString()
        }
        requestAnimationFrame(tick)
        countObs.unobserve(el)
      })
    }, { threshold: 0.5 })
    counters.forEach((el) => countObs.observe(el))

    return () => {
      obs.disconnect()
      countObs.disconnect()
    }
  }, [])

  return (
    <main className="bg-[#080808] text-white overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="-mt-20 relative w-full min-h-screen flex flex-col">
        <div className="absolute inset-0">
          <img
            src="/join-fireball-hero.jpg"
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* layered overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-[#080808]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-20 pt-40 max-w-7xl mx-auto w-full">
          {/* eyebrow */}
          <p className="jf-hero-badge text-[10px] font-semibold tracking-[0.3em] uppercase text-[#d42b2b] mb-6">
            Fireball Partner Program
          </p>

          <h1 className="jf-hero-line font-nav font-bold leading-[0.92] tracking-tight text-white">
            <span className="block text-[clamp(3.2rem,10vw,8.5rem)]">More Than</span>
            <span className="block text-[clamp(3.2rem,10vw,8.5rem)] text-white/20">a Business.</span>
          </h1>

          <p className="jf-hero-sub mt-8 max-w-lg text-white/60 text-base md:text-lg leading-relaxed font-light">
            Join a network built on mastery, mutual growth, and a shared
            commitment to raising the standard of automotive protection in Canada.
          </p>

          <div className="jf-hero-cta mt-10 flex items-center gap-5">
            <SecondaryClipButton
              to="/join"
              className="px-8 py-3 text-sm border-white/20"
            >
              Apply to Join
            </SecondaryClipButton>
            <Link
              to="#what-we-offer"
              className="text-white/40 text-sm hover:text-white/80 transition-colors duration-300 flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('what-we-offer')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span>Discover more</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>

        {/* scroll cue */}
        <div className="jf-hero-badge absolute bottom-8 right-8 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-12 bg-white/60 animate-pulse" />
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────────── */}
      <div className="border-y border-white/[0.06] py-4 overflow-hidden select-none">
        <div className="jf-ticker-track">
          {ticker.map((item, i) => (
            <span key={i} className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/20 flex-shrink-0">
              {item}
              <span className="mx-8 text-[#d42b2b] opacity-60">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── INTRO STATEMENT ──────────────────────────────────────────── */}
      <section className="px-6 py-28 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[1fr_2fr] gap-16 items-start">
          <div>
            <p className="jf-reveal text-[10px] font-semibold tracking-[0.3em] uppercase text-[#d42b2b] mb-4">
              Our Philosophy
            </p>
            <div className="jf-line h-px bg-white/10 w-full" />
          </div>
          <div>
            <p className="jf-reveal font-nav text-[clamp(1.6rem,4vw,2.8rem)] font-light leading-[1.2] text-white/90 tracking-tight">
              "We don't recruit installers.<br />
              <span className="text-white font-semibold">We build partners.</span>"
            </p>
            <p className="jf-reveal mt-8 text-white/40 text-base leading-relaxed max-w-xl" style={{ transitionDelay: '0.1s' }}>
              Fireball's partner program is an invitation-minded ecosystem —
              designed for professionals who see beyond the job and toward
              the legacy they're building. Business systems, human connection,
              and relentless product excellence come together here.
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] px-6 py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/[0.06]">
          {stats.map((s, i) => (
            <div
              key={i}
              className={cn(
                'jf-reveal px-8 py-10 text-center first:pl-0 last:pr-0',
                i === 0 && 'pl-0',
              )}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <p className="jf-stat-num font-nav font-bold text-[clamp(2.4rem,6vw,4rem)] text-white leading-none">
                <span data-count={s.value}>0</span>
                <span className="text-[#d42b2b]">{s.suffix}</span>
              </p>
              <p className="mt-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-white/30">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE OFFER (PILLARS) ───────────────────────────────────── */}
      <section id="what-we-offer" className="border-t border-white/[0.06] px-6 py-28">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16 gap-8">
            <div>
              <p className="jf-reveal text-[10px] font-semibold tracking-[0.3em] uppercase text-[#d42b2b] mb-4">
                What We Offer
              </p>
              <h2 className="jf-reveal font-nav font-bold text-[clamp(2rem,5vw,3.5rem)] tracking-tight leading-tight text-white">
                Six dimensions<br />of partnership.
              </h2>
            </div>
            <div className="hidden md:block">
              <SecondaryClipButton to="/join" className="text-sm px-6 py-2.5">
                Apply Now
              </SecondaryClipButton>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06]">
            {pillars.map((p, i) => (
              <div
                key={i}
                className="jf-card bg-[#080808] p-10 border border-transparent cursor-default"
              >
                <div className="jf-pillar-icon text-white/30 mb-6">{p.icon}</div>
                <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#d42b2b] mb-3">
                  {p.label}
                </p>
                <h3 className="font-nav font-semibold text-xl text-white mb-4 leading-snug">
                  {p.headline}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISUAL BREAK ─────────────────────────────────────────────── */}
      <section className="relative h-[60vh] overflow-hidden">
        <img
          src="/Assets/FireballBuisness B.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />
        <div className="relative z-10 h-full flex items-center px-6 max-w-7xl mx-auto">
          <div className="max-w-xl">
            <p className="jf-reveal-fade text-[10px] font-semibold tracking-[0.3em] uppercase text-[#d42b2b] mb-5">
              The Fireball Standard
            </p>
            <p className="jf-reveal font-nav font-light text-[clamp(1.6rem,4vw,2.6rem)] text-white leading-[1.2] tracking-tight">
              Products trusted by professionals.<br />
              <span className="text-white/40">Results trusted by clients.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── PROCESS ──────────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] px-6 py-28 max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="jf-reveal text-[10px] font-semibold tracking-[0.3em] uppercase text-[#d42b2b] mb-4">
            How It Works
          </p>
          <h2 className="jf-reveal font-nav font-bold text-[clamp(2rem,5vw,3.5rem)] tracking-tight leading-tight text-white">
            Four steps to<br />your partnership.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 divide-white/[0.06] md:divide-x">
          {steps.map((s, i) => (
            <div
              key={i}
              className="jf-step jf-reveal opacity-0 px-8 py-10 first:pl-0 last:pr-0 border-b md:border-b-0 border-white/[0.06] last:border-b-0"
            >
              <p className="jf-step-num font-nav font-bold text-[clamp(2.5rem,5vw,4rem)] text-white/[0.08] leading-none mb-6 transition-colors duration-300">
                {s.num}
              </p>
              <h3 className="font-nav font-semibold text-lg text-white mb-3">{s.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MEMBERSHIP TIERS PREVIEW ─────────────────────────────────── */}
      <section className="border-t border-white/[0.06] px-6 py-28 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <p className="jf-reveal text-[10px] font-semibold tracking-[0.3em] uppercase text-[#d42b2b] mb-4">
                Membership
              </p>
              <h2 className="jf-reveal font-nav font-bold text-[clamp(2rem,5vw,3.5rem)] tracking-tight leading-tight text-white">
                Two tiers.<br />One standard.
              </h2>
            </div>
            <p className="jf-reveal max-w-sm text-white/35 text-sm leading-relaxed">
              Whether you're launching your first shop or scaling an established operation,
              there's a path built for where you are — and where you're going.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Ignition */}
            <div className="jf-card border border-white/[0.08] p-10 rounded-sm">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/30 mb-2">Tier 01</p>
                  <h3 className="font-nav font-bold text-3xl text-white">Ignition</h3>
                </div>
                <img
                  src="/Assets/Fireball Ignition Membership.png"
                  alt="Ignition card"
                  className="w-20 object-contain opacity-80"
                  draggable={false}
                />
              </div>
              <p className="text-white/40 text-sm leading-relaxed mb-8">
                The foundation. Access certified training, wholesale pricing, and
                full partner onboarding to launch your Fireball business the right way.
              </p>
              <div className="space-y-3 mb-10">
                {['Fireball product access at partner pricing', 'Certification program included', 'Partner network access', 'Dedicated onboarding support'].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-[#d42b2b] flex-shrink-0" />
                    <span className="text-white/50 text-sm">{f}</span>
                  </div>
                ))}
              </div>
              <SecondaryClipButton to="/join" className="w-full justify-center text-sm py-3">
                Apply — Ignition
              </SecondaryClipButton>
            </div>

            {/* Apex */}
            <div className="jf-card border border-[#d42b2b]/30 bg-gradient-to-br from-[#d42b2b]/[0.04] to-transparent p-10 rounded-sm">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#d42b2b] mb-2">Tier 02</p>
                  <h3 className="font-nav font-bold text-3xl text-white">Apex</h3>
                </div>
                <img
                  src="/Assets/Fireball Apex Membership.png"
                  alt="Apex card"
                  className="w-20 object-contain"
                  draggable={false}
                />
              </div>
              <p className="text-white/40 text-sm leading-relaxed mb-8">
                For those who operate at the highest level. Apex unlocks elite benefits,
                priority access, co-marketing opportunities, and a seat at the table
                as Fireball grows.
              </p>
              <div className="space-y-3 mb-10">
                {[
                  'Everything in Ignition',
                  'Priority product allocation',
                  'Co-branded marketing assets',
                  'Exclusive Apex events & retreats',
                  'Direct line to the Fireball team',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-[#d42b2b] flex-shrink-0" />
                    <span className="text-white/50 text-sm">{f}</span>
                  </div>
                ))}
              </div>
              <SecondaryClipButton
                to="/join"
                className="w-full justify-center text-sm py-3 border-[#d42b2b]/40"
              >
                Apply — Apex
              </SecondaryClipButton>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL / PULL QUOTE ─────────────────────────────────── */}
      <section className="border-t border-white/[0.06] px-6 py-28 max-w-5xl mx-auto text-center">
        <div className="jf-reveal mb-6">
          <span className="text-[#d42b2b] text-4xl font-serif leading-none">"</span>
        </div>
        <blockquote className="jf-reveal font-nav font-light text-[clamp(1.5rem,4vw,2.4rem)] text-white/80 leading-[1.3] tracking-tight">
          Becoming a Fireball partner didn't just change how we do installs —
          it changed how we run our business, how we talk to clients,
          and what we believe is possible.
        </blockquote>
        <p className="jf-reveal mt-8 text-[11px] font-semibold tracking-[0.25em] uppercase text-white/25">
          — Fireball Certified Partner, Québec
        </p>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="relative border-t border-white/[0.06] overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 60% 50%, rgba(212,43,43,1) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10 px-6 py-36 max-w-7xl mx-auto text-center">
          <p className="jf-reveal text-[10px] font-semibold tracking-[0.3em] uppercase text-[#d42b2b] mb-6">
            Ready to Begin
          </p>
          <h2 className="jf-reveal font-nav font-bold text-[clamp(2.5rem,8vw,6rem)] tracking-tight leading-[0.92] text-white mb-8">
            Your application<br />
            <span className="text-white/20">starts here.</span>
          </h2>
          <p className="jf-reveal max-w-md mx-auto text-white/40 text-base leading-relaxed mb-12" style={{ transitionDelay: '0.1s' }}>
            We review every application personally. Expect to hear back
            within 3–5 business days.
          </p>
          <div className="jf-reveal flex flex-col sm:flex-row items-center justify-center gap-4" style={{ transitionDelay: '0.18s' }}>
            <SecondaryClipButton to="/join" className="px-10 py-4 text-sm">
              Begin Your Application
            </SecondaryClipButton>
            <Link
              to="/about"
              className="text-white/30 text-sm hover:text-white/60 transition-colors duration-300"
            >
              Learn about Fireball →
            </Link>
          </div>
        </div>

        {/* bottom wordmark */}
        <div className="border-t border-white/[0.04] px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/15">Fireball Canada</p>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/15">Partner Program</p>
        </div>
      </section>
    </main>
  )
}
