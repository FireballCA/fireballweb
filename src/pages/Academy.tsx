import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

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

    return () => {
      revealObs.disconnect()
    }
  }, [])

  return (
    <main className="bg-carbon-950 text-pearl min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-end pb-20 px-6 md:px-16 overflow-hidden -mt-20">
        {/* Background gradients */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 70% 40%, rgba(182,27,27,0.15) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(201,184,150,0.1) 0%, transparent 60%), #0a0a0a',
            }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
              maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)',
            }}
          />
        </div>

        {/* Academy Logo - placeholder */}
        <div className="absolute top-14 right-6 md:right-16 z-10 w-40 md:w-48 opacity-90 academy-reveal">
          <div className="text-chrome font-nav font-bold text-2xl">ACADEMY</div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="academy-reveal text-xs md:text-sm font-nav font-bold uppercase tracking-wider text-silver/70 mb-6 flex items-center gap-3">
            <span className="w-8 h-px bg-[#B61B1B]" />
            Fireball Canada
          </p>

          <h1 className="academy-reveal font-nav font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-tight leading-[0.88] mb-10 text-pearl">
            The
            <br />
            <em className="font-light text-[#B61B1B] not-italic">Academy.</em>
          </h1>

          <div className="academy-reveal flex flex-col md:flex-row md:items-end md:justify-between gap-8 md:gap-12">
            <p className="max-w-lg text-base md:text-lg font-sans font-light leading-relaxed text-silver/70">
              <strong className="font-normal text-pearl">
                Effective training is the foundation of a profitable business.
              </strong>{' '}
              Master professional ceramic coating installation, grow your client base, and join an exclusive network of certified Fireball installers across Canada.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 font-nav font-bold text-sm uppercase rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#B61B1B', color: 'white' }}
              >
                Join the Academy →
              </a>
              <a
                href="#what-you-learn"
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-silver/30 text-pearl font-nav font-bold text-sm uppercase rounded-lg hover:bg-carbon-700/30 transition-all duration-300"
              >
                See the Program
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="border-t border-carbon-700 border-b border-carbon-700 grid grid-cols-2 md:grid-cols-4">
        <div className="p-8 md:p-12 border-r border-carbon-700">
          <div className="text-4xl md:text-5xl font-nav font-bold tracking-tight leading-none text-pearl mb-2">
            500<sup className="text-xl md:text-2xl font-light text-[#B61B1B]">+</sup>
          </div>
          <div className="text-xs md:text-sm font-sans font-light text-silver/60 leading-relaxed">
            Certified installers
            <br />
            worldwide
          </div>
        </div>
        <div className="p-8 md:p-12 border-r border-carbon-700 md:border-r">
          <div className="text-4xl md:text-5xl font-nav font-bold tracking-tight leading-none text-pearl mb-2">
            20<sup className="text-xl md:text-2xl font-light text-[#B61B1B]">+</sup>
          </div>
          <div className="text-xs md:text-sm font-sans font-light text-silver/60 leading-relaxed">
            Countries in the
            <br />
            Fireball network
          </div>
        </div>
        <div className="p-8 md:p-12 border-r border-carbon-700 border-t border-carbon-700 md:border-t-0">
          <div className="text-4xl md:text-5xl font-nav font-bold tracking-tight leading-none text-pearl mb-2">
            50<sup className="text-xl md:text-2xl font-light text-[#B61B1B]">+</sup>
          </div>
          <div className="text-xs md:text-sm font-sans font-light text-silver/60 leading-relaxed">
            Professional-grade
            <br />
            products mastered
          </div>
        </div>
        <div className="p-8 md:p-12 border-t border-carbon-700 md:border-t-0">
          <div className="text-4xl md:text-5xl font-nav font-bold tracking-tight leading-none text-pearl mb-2">
            10<sup className="text-xl md:text-2xl font-light text-[#B61B1B]">+</sup>
          </div>
          <div className="text-xs md:text-sm font-sans font-light text-silver/60 leading-relaxed">
            Years of detailing
            <br />
            expertise
          </div>
        </div>
      </div>

      {/* Why Academy Section - White */}
      <section className="bg-white text-carbon-900 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="academy-reveal flex items-center gap-3 mb-4">
            <span className="text-[#B61B1B] text-xs font-nav font-bold uppercase tracking-widest">Why the Academy</span>
            <span className="w-8 h-px bg-[#B61B1B]" />
          </div>
          <h2 className="academy-reveal font-display text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-16 md:mb-20 text-carbon-900">
            Built to make
            <br />
            <em className="font-light text-carbon-600 not-italic">you more profitable.</em>
          </h2>
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            <div className="academy-reveal space-y-6">
              <p className="text-lg font-sans font-light leading-relaxed text-carbon-600">
                The Fireball Academy isn't a product manual. It's a{' '}
                <strong className="font-normal text-carbon-900">comprehensive business program</strong> designed to transform detailing professionals into certified, confident, and profitable installers.
              </p>
              <p className="text-lg font-sans font-light leading-relaxed text-carbon-600">
                You'll leave with hands-on experience across the full Fireball ecosystem — from surface prep to final coat — and a{' '}
                <strong className="font-normal text-carbon-900">certification that sets you apart</strong> in your market.
              </p>
              <p className="text-lg font-sans font-light leading-relaxed text-carbon-600">
                Joining the Academy also unlocks business-to-business pricing, bulk order capabilities, and ongoing support from the Fireball Canada team.
              </p>
            </div>
            <div className="academy-reveal space-y-0">
              {[
                {
                  num: '01',
                  title: 'B2B Pricing & Bulk Orders',
                  body: 'Certified installers gain access to exclusive distributor pricing and the ability to place bulk orders — directly improving your margins on every job.',
                },
                {
                  num: '02',
                  title: 'Certified Installer Listing',
                  body: 'Get listed on the official Fireball Canada installer map — a trusted reference for clients searching for certified professionals in your area.',
                },
                {
                  num: '03',
                  title: 'Ongoing Support & Updates',
                  body: "Training doesn't end after certification. Our team stays connected — product updates, technique refinements, and a direct line to our experts.",
                },
                {
                  num: '04',
                  title: 'Marketing & Business Tools',
                  body: 'Access co-branded marketing assets, Fireball-certified badges, and promotional materials to differentiate your shop and attract premium clients.',
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="py-7 border-b border-carbon-200 flex gap-6 items-start first:border-t border-carbon-200"
                >
                  <span className="text-xs font-sans font-light text-[#B61B1B] tracking-wider min-w-[32px] pt-1">
                    {feature.num}
                  </span>
                  <div>
                    <div className="text-base font-sans font-medium text-carbon-900 mb-2">{feature.title}</div>
                    <p className="text-sm font-sans font-light text-carbon-600 leading-relaxed">{feature.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - Dark */}
      <section className="bg-carbon-900 border-t border-carbon-700 border-b border-carbon-700 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="academy-reveal flex items-center gap-3 mb-4">
            <span className="text-[#B61B1B] text-xs font-nav font-bold uppercase tracking-widest">Our Values</span>
            <span className="w-8 h-px bg-[#B61B1B]" />
          </div>
          <h2 className="academy-reveal font-display text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-16 text-pearl">
            What drives
            <br />
            <em className="font-light text-silver/60 not-italic">everything we do.</em>
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-carbon-700 border border-carbon-700">
            {[
              {
                name: 'Passion',
                desc: 'We believe excellence comes from obsession. Our instructors are active detailing professionals — not just teachers. That passion translates directly into the quality of your training.',
              },
              {
                name: 'Innovation',
                desc: 'The detailing industry moves fast. Fireball stays ahead — in chemistry, application technique, and business strategy. We train you for what the industry demands today and tomorrow.',
              },
              {
                name: 'Family',
                desc: 'Certification is the beginning of an ongoing relationship. You join a global network of like-minded professionals who share knowledge, refer clients, and grow together.',
              },
            ].map((value, idx) => (
              <div
                key={idx}
                className="bg-carbon-900 p-10 md:p-12 relative overflow-hidden group hover:bg-carbon-800 transition-colors"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: 'radial-gradient(ellipse 80% 80% at 50% 0%, rgba(182,27,27,0.08), transparent)',
                  }}
                />
                <div className="relative z-10">
                  <div className="w-9 h-9 mb-7 opacity-85">
                    <div className="w-full h-full bg-[#B61B1B] rounded-sm" />
                  </div>
                  <div className="text-sm font-nav font-bold uppercase tracking-widest text-[#B61B1B] mb-4">{value.name}</div>
                  <p className="text-sm font-sans font-light leading-relaxed text-silver/60">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Learn Section - White */}
      <section id="what-you-learn" className="bg-white text-carbon-900 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="academy-reveal flex items-center gap-3 mb-4">
            <span className="text-[#B61B1B] text-xs font-nav font-bold uppercase tracking-widest">The Program</span>
            <span className="w-8 h-px bg-[#B61B1B]" />
          </div>
          <h2 className="academy-reveal font-display text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-16 text-carbon-900">
            Six modules.
            <br />
            <em className="font-light text-carbon-600 not-italic">Zero compromise.</em>
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-carbon-200 border border-carbon-200">
            {[
              {
                num: '01',
                title: 'Surface Analysis & Preparation',
                body: 'Learn to read paint conditions, identify contamination, and execute a flawless decontamination process — the foundation that determines every result.',
              },
              {
                num: '02',
                title: 'Paint Correction Techniques',
                body: 'Master compound and polish selection, machine technique, and finishing processes that maximize coating adhesion and visual clarity.',
              },
              {
                num: '03',
                title: 'Ceramic Coating Installation',
                body: 'Hands-on application of the full Fireball coating lineup — panel wrapping, flash time management, leveling, and final inspection protocols.',
              },
              {
                num: '04',
                title: 'Product Ecosystem Mastery',
                body: 'Deep familiarity with every Fireball product category — coatings, sealants, dressings, maintenance — so you can build the right service offering for your clients.',
              },
              {
                num: '05',
                title: 'Client Consultation & Quoting',
                body: 'Translate technical knowledge into confident client conversations. Learn how to assess, package, and price your services to maximize per-job revenue.',
              },
              {
                num: '06',
                title: 'Business Growth & Marketing',
                body: 'Leverage your Fireball certification as a growth engine — from local SEO and social strategy to referral networks and the Fireball installer directory.',
              },
            ].map((learn, idx) => (
              <div
                key={idx}
                className="bg-white p-8 md:p-10 hover:bg-carbon-50 transition-colors group"
              >
                <div className="text-xs font-sans font-light tracking-widest text-[#B61B1B] mb-5">{learn.num}</div>
                <div className="text-lg md:text-xl font-sans font-bold text-carbon-900 mb-3 leading-tight">{learn.title}</div>
                <p className="text-sm font-sans font-light leading-relaxed text-carbon-600">{learn.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section - Dark */}
      <section className="bg-carbon-900 border-t border-carbon-700 border-b border-carbon-700 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="academy-reveal flex items-center gap-3 mb-4">
            <span className="text-[#B61B1B] text-xs font-nav font-bold uppercase tracking-widest">How It Works</span>
            <span className="w-8 h-px bg-[#B61B1B]" />
          </div>
          <h2 className="academy-reveal font-display text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-16 text-pearl">
            From application
            <br />
            <em className="font-light text-silver/60 not-italic">to certified.</em>
          </h2>
          <div className="grid md:grid-cols-4 gap-0 border-t border-carbon-700">
            {[
              {
                num: '01',
                title: 'Apply Online',
                body: "Submit your application through the form below. Tell us about your business, your experience level, and what you're looking to achieve.",
              },
              {
                num: '02',
                title: 'Onboarding Call',
                body: 'Our team reviews your application and schedules a quick call to align expectations, answer your questions, and confirm your training date.',
              },
              {
                num: '03',
                title: 'Hands-On Training',
                body: 'Attend your in-person or mentored training session. Work directly with certified Fireball professionals across real installation scenarios.',
              },
              {
                num: '04',
                title: 'Get Certified',
                body: 'Complete your certification exam, receive your official Fireball Certified badge, and get listed on the national installer directory.',
              },
            ].map((step, idx) => (
              <div key={idx} className="p-8 md:p-10 border-r border-carbon-700 last:border-r-0">
                <div className="text-5xl md:text-6xl font-nav font-bold text-carbon-800 leading-none mb-5 tracking-tight">
                  {step.num}
                </div>
                <div className="text-base font-sans font-semibold text-pearl mb-3">{step.title}</div>
                <p className="text-sm font-sans font-light leading-relaxed text-silver/60">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - White */}
      <section className="bg-white text-carbon-900 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="academy-reveal flex items-center gap-3 mb-4">
            <span className="text-[#B61B1B] text-xs font-nav font-bold uppercase tracking-widest">From the Community</span>
            <span className="w-8 h-px bg-[#B61B1B]" />
          </div>
          <h2 className="academy-reveal font-display text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-16 text-carbon-900">
            Real installers.
            <br />
            <em className="font-light text-carbon-600 not-italic">Real results.</em>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                text: 'The training completely changed how I approach every job. I went from hesitant on ceramic coatings to fully confident — and my close rate on coating packages has more than doubled.',
                author: 'Marc-André Tremblay',
                company: 'Prestige Auto Détail, Montréal QC',
              },
              {
                text: 'What Fireball offers goes beyond technique. They invest in your business. The B2B pricing alone paid for the training in the first month. The network is invaluable.',
                author: 'Kevin Beauchamp',
                company: 'KB Detailing Co., Québec QC',
              },
              {
                  text: "Being listed as a Fireball Certified installer immediately positioned my shop differently. Clients seek you out specifically. It's a credential that actually converts.",
                author: 'Jason Villeneuve',
                company: 'ProCoat Solutions, Ottawa ON',
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="p-8 md:p-10 border border-carbon-200 rounded-lg relative hover:border-carbon-300 transition-colors"
              >
                <div
                  className="absolute top-6 right-8 text-8xl font-nav font-bold text-[#B61B1B]/10 leading-none"
                  style={{ fontFamily: 'serif' }}
                >
                  "
                </div>
                <p className="text-base font-sans font-light italic leading-relaxed text-carbon-700 mb-7 relative z-10">
                  {testimonial.text}
                </p>
                <div className="text-sm font-sans font-medium text-carbon-900">{testimonial.author}</div>
                <div className="text-xs font-sans font-light text-carbon-600 mt-1">{testimonial.company}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Red */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#B61B1B' }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 100% at 100% 50%, rgba(213,0,55,0.3), transparent), radial-gradient(ellipse 40% 80% at 0% 50%, rgba(0,0,0,0.2), transparent)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-24 md:py-32 flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-16">
          <div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tight leading-tight text-white mb-5">
              Ready to
              <br />
              <em className="font-light opacity-70 not-italic">get certified?</em>
            </h2>
            <p className="text-base font-sans font-light text-white/80 max-w-md leading-relaxed">
              Spots are limited. Apply now and take the first step toward building a more profitable, more professional detailing business.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#B61B1B] font-nav font-bold text-sm uppercase rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Apply Now →
            </a>
            <a
              href="/join-fireball"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/40 text-white font-nav font-bold text-sm uppercase rounded-lg hover:border-white/80 transition-colors whitespace-nowrap"
            >
              Learn About Certification
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section - Dark */}
      <section id="contact" className="bg-carbon-900 border-t border-carbon-700 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="academy-reveal flex items-center gap-3 mb-4">
            <span className="text-[#B61B1B] text-xs font-nav font-bold uppercase tracking-widest">Get In Touch</span>
            <span className="w-8 h-px bg-[#B61B1B]" />
          </div>
          <h2 className="academy-reveal font-display text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight mb-16 text-pearl">
            Let's work
            <br />
            <em className="font-light text-silver/60 not-italic">together.</em>
          </h2>
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            <div className="academy-reveal space-y-6">
              <p className="text-base md:text-lg font-sans font-light leading-relaxed text-silver/60">
                <strong className="font-normal text-pearl">Investing in yourself is the best investment you'll make.</strong> We're here to make sure you come out the other side more profitable, more skilled, and part of something bigger.
              </p>
              <p className="text-base md:text-lg font-sans font-light leading-relaxed text-silver/60">
                Have questions before applying? Our team is available to walk you through the program, discuss your current setup, and help you understand exactly what certification can do for your business.
              </p>
              <div className="mt-12 space-y-4">
                <div>
                  <div className="text-xs font-nav font-bold uppercase tracking-widest text-[#B61B1B] mb-2">Email</div>
                  <a
                    href="mailto:academy@fireballcanada.com"
                    className="text-base font-sans font-light text-pearl hover:text-[#B61B1B] transition-colors"
                  >
                    academy@fireballcanada.com
                  </a>
                </div>
                <div>
                  <div className="text-xs font-nav font-bold uppercase tracking-widest text-[#B61B1B] mb-2">Response Time</div>
                  <p className="text-sm font-sans font-light text-silver/60">Within 1–2 business days</p>
                </div>
              </div>
            </div>
            <form className="academy-reveal space-y-4" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-nav font-bold uppercase tracking-widest text-silver/60">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jean"
                    className="bg-carbon-800 border border-carbon-700 rounded-lg px-4 py-3.5 text-pearl font-sans font-light text-sm placeholder:text-silver/30 focus:outline-none focus:border-carbon-600 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-nav font-bold uppercase tracking-widest text-silver/60">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Tremblay"
                    className="bg-carbon-800 border border-carbon-700 rounded-lg px-4 py-3.5 text-pearl font-sans font-light text-sm placeholder:text-silver/30 focus:outline-none focus:border-carbon-600 transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-nav font-bold uppercase tracking-widest text-silver/60">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean@monshop.ca"
                  className="bg-carbon-800 border border-carbon-700 rounded-lg px-4 py-3.5 text-pearl font-sans font-light text-sm placeholder:text-silver/30 focus:outline-none focus:border-carbon-600 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-nav font-bold uppercase tracking-widest text-silver/60">Business Name</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Prestige Auto Détail"
                  className="bg-carbon-800 border border-carbon-700 rounded-lg px-4 py-3.5 text-pearl font-sans font-light text-sm placeholder:text-silver/30 focus:outline-none focus:border-carbon-600 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-nav font-bold uppercase tracking-widest text-silver/60">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your business and what you're looking to achieve..."
                  rows={5}
                  className="bg-carbon-800 border border-carbon-700 rounded-lg px-4 py-3.5 text-pearl font-sans font-light text-sm placeholder:text-silver/30 focus:outline-none focus:border-carbon-600 transition-colors resize-y"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-8 py-3.5 font-nav font-bold text-sm uppercase rounded-lg hover:opacity-90 transition-opacity mt-2"
                style={{ backgroundColor: '#B61B1B', color: 'white' }}
              >
                Send Message →
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
