import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'

export function Academy() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    businessName: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: wire to your form backend
    console.log('Form submitted:', formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const roadmapRef = useRef<HTMLDivElement>(null)
  const roadmapFillRef = useRef<HTMLDivElement>(null)
  const [secondaryHover, setSecondaryHover] = useState(false)

  const secondaryLinkCssVars = useRef<CSSProperties>({
    '--clip-x': '50%',
    '--clip-y': '50%',
    '--clip-r': '0px',
  } as CSSProperties)

  const setSecondaryClipVars = useCallback((el: HTMLAnchorElement, clientX: number, clientY: number) => {
    const rect = el.getBoundingClientRect()
    const w = rect.width || 1
    const h = rect.height || 1
    const localX = clientX - rect.left
    const localY = clientY - rect.top
    const x = (localX / w) * 100
    const y = (localY / h) * 100
    const d1 = Math.hypot(localX, localY)
    const d2 = Math.hypot(w - localX, localY)
    const d3 = Math.hypot(localX, h - localY)
    const d4 = Math.hypot(w - localX, h - localY)
    const r = Math.max(d1, d2, d3, d4)
    el.style.setProperty('--clip-x', `${x}%`)
    el.style.setProperty('--clip-y', `${y}%`)
    el.style.setProperty('--clip-r', `${r}px`)
  }, [])

  const onSecondaryPointerEnter = useCallback((e: ReactPointerEvent<HTMLAnchorElement>) => {
    setSecondaryClipVars(e.currentTarget, e.clientX, e.clientY)
    setSecondaryHover(true)
  }, [setSecondaryClipVars])

  const onSecondaryPointerMove = useCallback((e: ReactPointerEvent<HTMLAnchorElement>) => {
    setSecondaryClipVars(e.currentTarget, e.clientX, e.clientY)
  }, [setSecondaryClipVars])

  const onSecondaryPointerLeave = useCallback((e: ReactPointerEvent<HTMLAnchorElement>) => {
    setSecondaryClipVars(e.currentTarget, e.clientX, e.clientY)
    setSecondaryHover(false)
  }, [setSecondaryClipVars])

  useEffect(() => {
    // Fade in animation
    const reveals = document.querySelectorAll<HTMLElement>('.academy-reveal')
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('academy-visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )
    reveals.forEach((el) => revealObs.observe(el))

    // Roadmap scroll animation
    const roadmap = roadmapRef.current
    const fill = roadmapFillRef.current
    if (!roadmap || !fill) {
      return () => {
        revealObs.disconnect()
      }
    }

    const dots = Array.from(roadmap.querySelectorAll<HTMLElement>('.rm-dot'))
    const cards = Array.from(roadmap.querySelectorAll<HTMLElement>('.rm-content'))

    const update = () => {
      const winH = window.innerHeight
      const rect = roadmap.getBoundingClientRect()
      const total = roadmap.offsetHeight
      const threshold = winH * 0.6

      const scrolled = Math.max(0, Math.min(1, (threshold - rect.top) / total))
      fill.style.height = `${scrolled * 100}%`

      dots.forEach((dot, i) => {
        const dotRect = dot.getBoundingClientRect()
        const dotCenter = dotRect.top + dotRect.height / 2
        if (dotCenter < threshold) {
          dot.classList.add('active')
          if (cards[i]) cards[i].classList.add('visible')
        }
      })
    }

    window.addEventListener('scroll', update, { passive: true })
    update()

    return () => {
      revealObs.disconnect()
      window.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <main className="bg-carbon-950 text-pearl min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] md:min-h-screen flex items-center justify-center px-6 md:px-16 overflow-hidden -mt-20">
        {/* Video Background */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/Academy Background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60 z-0" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full text-center">
          <h1 className="academy-reveal text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-tight leading-[0.88] mb-10 text-pearl" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 900 }}>
            Build your expertise.
          </h1>

          <p className="academy-reveal max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-silver/70 mb-10" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
            <strong className="font-normal text-pearl">
              Effective training is the foundation of a profitable business.
            </strong>{' '}
            Master professional ceramic coating installation, grow your client base, and join an exclusive network of certified Fireball installers across Canada.
          </p>

          <div className="academy-reveal flex flex-wrap justify-center gap-4">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-8 py-2.5 font-nav font-bold text-sm uppercase rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#1266F0', color: 'white' }}
            >
              Apply for training
            </a>
            <a
              href="#what-you-learn"
              className="relative inline-flex items-center justify-center overflow-hidden rounded-xl border border-white/[0.12] bg-transparent px-8 py-2.5 text-center font-nav text-sm font-bold uppercase transition-[border-color,color] duration-500 ease-out hover:border-white/25 motion-reduce:transition-none"
              style={secondaryLinkCssVars.current}
              onPointerEnter={onSecondaryPointerEnter}
              onPointerMove={onSecondaryPointerMove}
              onPointerLeave={onSecondaryPointerLeave}
            >
              <span
                className="pointer-events-none absolute inset-0 z-0 bg-white"
                style={{
                  clipPath: `circle(${secondaryHover ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                  WebkitClipPath: `circle(${secondaryHover ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                  transition:
                    'clip-path 900ms cubic-bezier(0.22,1,0.36,1), -webkit-clip-path 900ms cubic-bezier(0.22,1,0.36,1)',
                  willChange: 'clip-path',
                }}
                aria-hidden
              />
              <span
                className={`relative z-10 transition-colors duration-500 motion-reduce:duration-200 ${
                  secondaryHover ? 'text-black' : 'text-pearl'
                }`}
              >
                Next training
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Section 2: Why the Fireball Academy */}
      <section className="bg-white text-carbon-900 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <h2 className="academy-reveal text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-16 text-carbon-900 text-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 900 }}>
            Why the Fireball Academy
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: '🎓',
                title: 'Hands-on training',
                body: 'Learn real techniques used by professional installers.',
              },
              {
                icon: '✓',
                title: 'Certification',
                body: 'Become a certified Fireball installer.',
              },
              {
                icon: '📈',
                title: 'Business growth',
                body: 'Develop the skills needed to grow your detailing business.',
              },
            ].map((item, idx) => (
              <div key={idx} className="academy-reveal text-center">
                <div className="text-5xl mb-6">{item.icon}</div>
                <h3 className="text-xl font-bold text-carbon-900 mb-4" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700 }}>
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed text-carbon-600" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: What you will learn - Roadmap */}
      <section id="what-you-learn" className="roadmap-section">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <h2 className="academy-reveal text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-16 mt-16 md:mt-24 text-carbon-900 text-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 900 }}>
            What you will learn
          </h2>
        </div>
        <div className="roadmap-wrap" ref={roadmapRef}>
          <div className="roadmap-spine"></div>
          <div className="roadmap-fill" ref={roadmapFillRef}></div>

          <div className="roadmap-item">
            <div className="rm-content">
              <div className="rm-card">
                <span className="rm-num">01</span>
                <div className="rm-title">Ceramic Coating Application</div>
                <p className="rm-body">Professional coating installation techniques.</p>
                <span className="rm-tag highlight">Day 1 — Morning</span>
              </div>
            </div>
            <div className="rm-node"><div className="rm-dot"></div></div>
            <div className="rm-empty"></div>
          </div>

          <div className="roadmap-item">
            <div className="rm-empty"></div>
            <div className="rm-node"><div className="rm-dot"></div></div>
            <div className="rm-content">
              <div className="rm-card">
                <span className="rm-num">02</span>
                <div className="rm-title">Surface Preparation</div>
                <p className="rm-body">Proper paint correction and preparation methods.</p>
                <span className="rm-tag">Day 1 — Afternoon</span>
              </div>
            </div>
          </div>

          <div className="roadmap-item">
            <div className="rm-content">
              <div className="rm-card">
                <span className="rm-num">03</span>
                <div className="rm-title">Product Knowledge</div>
                <p className="rm-body">Understanding Fireball's coating technologies.</p>
                <span className="rm-tag highlight">Day 2 — Morning</span>
              </div>
            </div>
            <div className="rm-node"><div className="rm-dot"></div></div>
            <div className="rm-empty"></div>
          </div>

          <div className="roadmap-item">
            <div className="rm-empty"></div>
            <div className="rm-node"><div className="rm-dot"></div></div>
            <div className="rm-content">
              <div className="rm-card">
                <span className="rm-num">04</span>
                <div className="rm-title">Business Strategies</div>
                <p className="rm-body">How to position and sell professional protection services.</p>
                <span className="rm-tag highlight">Certification Day</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: The training experience */}
      <section className="bg-carbon-900 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="academy-reveal">
              <img
                src="/Assets/Factory Background.png"
                alt="Formation en atelier"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="academy-reveal">
              <h2 className="text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-6 text-pearl" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 900 }}>
                Learn by doing.
              </h2>
              <p className="text-lg leading-relaxed text-silver/60" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
                Our training sessions combine theory and hands-on practice. Participants work directly on real vehicles under expert guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Certification */}
      <section className="bg-white text-carbon-900 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="academy-reveal">
              <h2 className="text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-6 text-carbon-900" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 900 }}>
                Become Fireball Certified
              </h2>
              <p className="text-lg leading-relaxed text-carbon-600" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
                After completing the training, participants may qualify to become certified Fireball installers and gain access to professional products and support.
              </p>
            </div>
            <div className="academy-reveal text-center">
              <div className="w-48 h-48 mx-auto bg-[#1266F0] rounded-full flex items-center justify-center text-white text-6xl font-bold">
                ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Who is this for */}
      <section className="bg-carbon-900 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <h2 className="academy-reveal text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-16 text-pearl text-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 900 }}>
            Who is this for
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Detailing professionals',
                body: 'Looking to expand their services.',
              },
              {
                title: 'Automotive enthusiasts',
                body: 'Who want to master professional techniques.',
              },
              {
                title: 'Business owners',
                body: 'Who want to offer premium protection services.',
              },
            ].map((item, idx) => (
              <div key={idx} className="academy-reveal bg-carbon-800 p-8 rounded-lg">
                <h3 className="text-xl font-bold text-pearl mb-4" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700 }}>
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed text-silver/60" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Upcoming training */}
      <section className="bg-white text-carbon-900 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <h2 className="academy-reveal text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-16 text-carbon-900 text-center" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 900 }}>
            Upcoming training
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { city: 'Montreal', date: 'March 15, 2025', places: '12 places available' },
              { city: 'Toronto', date: 'April 20, 2025', places: '8 places available' },
              { city: 'Vancouver', date: 'May 10, 2025', places: '15 places available' },
            ].map((training, idx) => (
              <div key={idx} className="academy-reveal border border-carbon-200 rounded-lg p-8 hover:border-carbon-300 transition-colors">
                <h3 className="text-2xl font-bold text-carbon-900 mb-4" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700 }}>
                  {training.city}
                </h3>
                <p className="text-base text-carbon-600 mb-2" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400 }}>
                  {training.date}
                </p>
                <p className="text-sm text-carbon-500 mb-6" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
                  {training.places}
                </p>
                <a
                  href="#contact"
                  className="inline-block px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm font-bold uppercase"
                  style={{ backgroundColor: '#1266F0', color: 'white', fontFamily: "'Roboto', sans-serif" }}
                >
                  Apply
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: Final CTA */}
      <section className="bg-carbon-900 py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 md:px-16 text-center">
          <h2 className="academy-reveal text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-6 text-pearl" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 900 }}>
            Take the next step.
          </h2>
          <p className="academy-reveal text-lg leading-relaxed text-silver/60 mb-10" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
            Join the Fireball Academy and elevate your expertise.
          </p>
          <a
            href="#contact"
            className="academy-reveal inline-flex items-center gap-2 px-8 py-4 font-nav font-bold text-sm uppercase rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1266F0', color: 'white' }}
          >
            Apply for training
          </a>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-white text-carbon-900 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="academy-reveal mb-4">
            <span className="text-[#1266F0] text-xs font-nav font-bold uppercase tracking-widest">Get In Touch</span>
          </div>
          <h2 className="academy-reveal text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-16 text-carbon-900" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 900 }}>
            Let's work
            <br />
            <em className="font-light text-carbon-600 not-italic" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>together.</em>
          </h2>
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            <div className="academy-reveal space-y-6">
              <p className="text-base md:text-lg leading-relaxed text-carbon-600" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
                <strong className="font-normal text-carbon-900">Investing in yourself is the best investment you'll make.</strong> We're here to make sure you come out the other side more profitable, more skilled, and part of something bigger.
              </p>
              <p className="text-base md:text-lg leading-relaxed text-carbon-600" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
                Have questions before applying? Our team is available to walk you through the program, discuss your current setup, and help you understand exactly what certification can do for your business.
              </p>
              <div className="mt-12 space-y-4">
                <div>
                  <div className="text-xs font-nav font-bold uppercase tracking-widest text-[#1266F0] mb-2">Email</div>
                  <a
                    href="mailto:academy@fireballcanada.com"
                    className="text-base text-carbon-900 hover:text-[#1266F0] transition-colors"
                    style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}
                  >
                    academy@fireballcanada.com
                  </a>
                </div>
                <div>
                  <div className="text-xs font-nav font-bold uppercase tracking-widest text-[#1266F0] mb-2">Response Time</div>
                  <p className="text-sm text-carbon-600" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>Within 1–2 business days</p>
                </div>
              </div>
            </div>
            <form className="academy-reveal space-y-4" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-nav font-bold uppercase tracking-widest text-carbon-600">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jean"
                    className="bg-carbon-50 border border-carbon-200 rounded-lg px-4 py-3.5 text-carbon-900 text-sm placeholder:text-carbon-400 focus:outline-none focus:border-[#1266F0] transition-colors"
                    style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-nav font-bold uppercase tracking-widest text-carbon-600">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Tremblay"
                    className="bg-carbon-50 border border-carbon-200 rounded-lg px-4 py-3.5 text-carbon-900 text-sm placeholder:text-carbon-400 focus:outline-none focus:border-[#1266F0] transition-colors"
                    style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-nav font-bold uppercase tracking-widest text-carbon-600">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean@monshop.ca"
                  className="bg-carbon-50 border border-carbon-200 rounded-lg px-4 py-3.5 text-carbon-900 text-sm placeholder:text-carbon-400 focus:outline-none focus:border-[#1266F0] transition-colors"
                  style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-nav font-bold uppercase tracking-widest text-carbon-600">Business Name</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Prestige Auto Détail"
                  className="bg-carbon-50 border border-carbon-200 rounded-lg px-4 py-3.5 text-carbon-900 text-sm placeholder:text-carbon-400 focus:outline-none focus:border-[#1266F0] transition-colors"
                  style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-nav font-bold uppercase tracking-widest text-carbon-600">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your business and what you're looking to achieve..."
                  rows={5}
                  className="bg-carbon-50 border border-carbon-200 rounded-lg px-4 py-3.5 text-carbon-900 text-sm placeholder:text-carbon-400 focus:outline-none focus:border-[#1266F0] transition-colors resize-y"
                  style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}
                />
              </div>
              <button
                type="submit"
                className="relative inline-block text-sm text-carbon-900 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full mt-2"
                style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400 }}
              >
                Send Message →
                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
