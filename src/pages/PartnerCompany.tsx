import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LiquidGlassSelect } from '@/components/LiquidGlassSelect'
import { IOSCheckbox } from '@/components/IOSCheckbox'
import { isAuthenticated as checkIsAuthenticated } from '@/utils/supabaseAuth'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/context/NotificationsContext'
import { SEO, breadcrumbJsonLd } from '@/components/SEO'

const yearsInOperation = ['Less than 1 year', '1-3 years', '3-5 years', '5+ years']
const coatingInstallations = ['0-10', '10-50', '50-100', '100+']
const teamSizes = ['1', '2-3', '4-6', '7+']

const serviceOptions = [
  'Exterior Detailing',
  'Paint Correction',
  'Ceramic Coating',
  'Paint Protection Film (PPF)',
  'Window Tint',
  'Interior Detailing',
  'Mobile Services',
]

const businessFields = [
  { label: 'Business Name', name: 'businessName', type: 'text' },
  { label: 'Owner / Primary Contact', name: 'ownerPrimaryContact', type: 'text' },
  { label: 'Business Email', name: 'businessEmail', type: 'email' },
  { label: 'Phone Number', name: 'phoneNumber', type: 'text' },
  { label: 'Website or Social Media', name: 'websiteOrSocialMedia', type: 'text' },
  { label: 'Business Address', name: 'businessAddress', type: 'text' },
] as const

const partnerAdvantages = [
  'Access to professional-only ceramic coating systems',
  'Official warranty registration privileges',
  'Exclusive partner pricing',
  'Listing within the Fireball Certified Network',
  'Access to the Fireball Partner Portal',
  'National brand alignment and credibility',
  'Ongoing technical and product support',
]

const professionalRequirements = [
  'Operate a legally registered detailing or automotive service business',
  'Maintain valid commercial liability insurance',
  'Demonstrate proven expertise in paint correction',
  'Possess professional-grade equipment suitable for ceramic coating application',
  'Maintain a controlled installation environment (indoor workspace recommended)',
  'Show advanced knowledge of decontamination and surface preparation processes',
  'Deliver consistent, high-quality workmanship',
  'Uphold strong customer service standards',
]

const additionalEvaluationCriteria = [
  'Portfolio quality and documented work history',
  'Workshop cleanliness and professionalism',
  'Online presence and brand representation',
  'Business longevity and stability',
  'Commitment to ongoing education and skill development',
]

const partnerResponsibilities = [
  'Follow Fireball product application guidelines strictly',
  'Respect warranty registration protocols',
  'Maintain installation quality standards',
  'Represent the Fireball brand professionally',
  'Participate in future product training or updates when required',
]

export function PartnerCompany() {
  type PartnerApplicationStatus = 'pending' | 'payment_pending' | 'partner' | 'declined'

  const [submitted, setSubmitted] = useState(false)
  const [services, setServices] = useState<string[]>([])
  const [agreementChecked, setAgreementChecked] = useState(false)
  const [yearsOperationValue, setYearsOperationValue] = useState('')
  const [coatingInstallationsValue, setCoatingInstallationsValue] = useState('')
  const [teamSizeValue, setTeamSizeValue] = useState('')
  const [physicalLocation, setPhysicalLocation] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<PartnerApplicationStatus | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminFormOverride, setAdminFormOverride] = useState(false)
  const { notify } = useNotifications()

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const auth = await checkIsAuthenticated()
      if (!mounted) return
      setAuthenticated(auth)
      if (auth) {
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData.user?.id
        if (userId) {
          const [{ data: existing }, { data: profile }] = await Promise.all([
            supabase
              .from('partner_companies')
              .select('status')
              .eq('user_id', userId)
              .order('submitted_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
          ])

          const normalized = String(existing?.status || '').toLowerCase()
          if (
            normalized === 'pending' ||
            normalized === 'payment_pending' ||
            normalized === 'partner' ||
            normalized === 'declined'
          ) {
            setApplicationStatus(normalized as PartnerApplicationStatus)
          } else {
            setApplicationStatus(null)
          }

          if ((profile?.role || '').toLowerCase() === 'admin') {
            setIsAdmin(true)
          }
        } else {
          setApplicationStatus(null)
        }
      } else {
        setApplicationStatus(null)
      }
      setAuthChecked(true)
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  const hasActiveApplication =
    applicationStatus === 'pending' ||
    applicationStatus === 'payment_pending' ||
    applicationStatus === 'partner'

  const formBlocked = authChecked && (!authenticated || (hasActiveApplication && !adminFormOverride))

  if (submitted) {
    return (
      <section className="min-h-screen bg-black px-6 py-24 flex items-center justify-center text-white">
        <div className="max-w-[760px] text-center">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">Application Received</h1>
          <p className="mt-6 text-white/75 text-sm md:text-base leading-relaxed">
            Your request to join the Fireball Certified Network is now under review.
          </p>
          <p className="mt-4 text-white/65 text-sm md:text-base leading-relaxed">
            If approved, you will receive access to the Fireball Partner Portal to begin registering
            installations and managing client warranties.
          </p>
        </div>
      </section>
    )
  }

  return (
    <>
      <SEO
        title="Become a Fireball Certified Installer — Join Our Partner Network"
        description="Join Fireball Canada's certified installer network. Apply to become an authorized Fireball ceramic coating installer, get listed on the official locator and grow your detailing business."
        canonicalPath="/join"
        keywords="become Fireball installer, certified ceramic coating installer Canada, Fireball partner program, join Fireball, authorized detailing partner, ceramic coating dealer Canada"
        jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Join Fireball', path: '/join' }])}
      />
      <section className="min-h-screen px-6 md:px-12 lg:px-16 pt-0 pb-24 text-white" style={{ backgroundColor: '#141416' }}>
      <div className="max-w-[1100px] mx-auto">
        <section className="relative min-h-[calc(62vh+8rem)] flex flex-col text-center">
          <div className="h-24 shrink-0" aria-hidden />
          <div className="flex-1 flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/75 w-fit mx-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            We are currently accepting new partner applications
          </div>

          <h1 className="relative z-10 mt-10 md:mt-12 text-4xl md:text-6xl font-bold tracking-tight">
            Become a Fireball Certified Partner
          </h1>
          <div className="-mt-10 md:-mt-12 pointer-events-none select-none w-full flex justify-center">
            <p className="text-[clamp(3.8rem,14vw,10rem)] font-black uppercase leading-[0.78] tracking-[-0.045em] bg-gradient-to-b from-white/[0.2] via-white/[0.08] to-transparent bg-clip-text text-transparent">
              Fireball Network
            </p>
          </div>

          <p className="relative z-10 mt-2 max-w-[900px] mx-auto text-white/75 text-sm md:text-base leading-relaxed">
            Become a recognized Fireball installation partner and offer industry-leading ceramic protection backed by
            official warranty registration and national brand support.
          </p>
          <p className="relative z-10 mt-4 text-xs text-white/55 text-center">
            Applications are selectively approved to maintain network quality.
          </p>
          </div>
        </section>

        <section className="mt-12 relative left-1/2 right-1/2 w-screen -translate-x-1/2 bg-[#252525] rounded-[34px] px-6 md:px-12 lg:px-16 py-8 md:py-10 shadow-[0_24px_36px_rgba(0,0,0,0.28)]">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Partner Advantages</h2>
            <p className="mt-3 text-white/75 text-sm md:text-base leading-relaxed">
              Certified Fireball Installers receive:
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {partnerAdvantages.map((benefit) => (
                <div
                  key={benefit}
                  className="bg-[#252525] border border-white/10 text-white px-3.5 py-2.5 rounded-[8px] text-xs flex items-center gap-2"
                >
                  <span className="text-emerald-400 text-sm select-none">+</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 md:mt-10 translate-y-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Professional Requirements</h2>
            <p className="mt-3 text-white/75 text-sm md:text-base leading-relaxed">
              Applicants must:
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {professionalRequirements.map((requirement) => (
                <div
                  key={requirement}
                  className="bg-black/25 border border-white/10 text-white/90 px-3.5 py-2.5 rounded-[8px] text-xs flex items-center gap-2"
                >
                  <span className="text-red-400 text-sm select-none">+</span>
                  <span>{requirement}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 md:mt-10 translate-y-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Additional Evaluation Criteria</h2>
            <p className="mt-3 text-white/75 text-sm md:text-base leading-relaxed">
              Fireball Canada may also evaluate:
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {additionalEvaluationCriteria.map((criterion) => (
                <div
                  key={criterion}
                  className="bg-black/25 border border-white/10 text-white/90 px-3.5 py-2.5 rounded-[8px] text-xs flex items-center gap-2"
                >
                  <span className="text-red-400 text-sm select-none">+</span>
                  <span>{criterion}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 md:mt-10 translate-y-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Partner Responsibilities</h2>
            <p className="mt-3 text-white/75 text-sm md:text-base leading-relaxed">
              Certified installers must:
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {partnerResponsibilities.map((responsibility) => (
                <div
                  key={responsibility}
                  className="bg-black/25 border border-white/10 text-white/90 px-3.5 py-2.5 rounded-[8px] text-xs flex items-center gap-2"
                >
                  <span className="text-red-400 text-sm select-none">+</span>
                  <span>{responsibility}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              Failure to uphold these standards may result in certification review or suspension.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Apply for Certification</h2>
          <p className="mt-3 text-white/75 text-sm md:text-base leading-relaxed max-w-[780px]">
            Before submitting your application, please review the certification standards and eligibility requirements
            outlined below.
            <br />
            Fireball Canada carefully selects installation partners who demonstrate exceptional technical ability,
            professionalism, and commitment to high-end vehicle protection standards.
          </p>
        </section>

        <form
          className="mt-8 rounded-3xl p-6 md:p-8 relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(40, 40, 40, 0.96) 0%, rgba(22, 22, 22, 0.96) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow:
              '0 18px 45px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px rgba(255,255,255,0.03)',
          }}
          onSubmit={(e) => {
            e.preventDefault()
            setFormError('')
            if (!authenticated || (hasActiveApplication && !adminFormOverride)) return
            const form = e.currentTarget
            if (!form.checkValidity()) {
              form.reportValidity()
              return
            }
            if (!yearsOperationValue || !coatingInstallationsValue || !teamSizeValue) {
              setFormError('Please complete all dropdown fields before submitting.')
              return
            }
            if (!physicalLocation) {
              setFormError('Please select your operation type (physical location or mobile only).')
              return
            }
            if (services.length === 0) {
              setFormError('Please select at least one offered service.')
              return
            }
            if (!agreementChecked) return
            setSubmitting(true)
            ;(async () => {
              try {
                const { data: userData } = await supabase.auth.getUser()
                const userId = userData.user?.id
                if (!userId) {
                  setFormError('You must be signed in to submit this application.')
                  return
                }

                const formData = new FormData(form)
                const applicationData = {
                  business_name: String(formData.get('businessName') || '').trim(),
                  owner_primary_contact: String(formData.get('ownerPrimaryContact') || '').trim(),
                  business_email: String(formData.get('businessEmail') || '').trim(),
                  phone_number: String(formData.get('phoneNumber') || '').trim(),
                  website_or_social_media: String(formData.get('websiteOrSocialMedia') || '').trim(),
                  business_address: String(formData.get('businessAddress') || '').trim(),
                  years_in_operation: yearsOperationValue,
                  services_offered: services,
                  coating_installations: coatingInstallationsValue,
                  previous_brands: String(formData.get('previousBrands') || '').trim(),
                  operation_type: physicalLocation === 'yes' ? 'physical' : 'mobile_only',
                  team_size: teamSizeValue,
                  agreement_accepted: agreementChecked,
                  submitted_via: 'partner_company_page',
                }

                const { error } = await supabase
                  .from('partner_companies')
                  .upsert(
                    {
                      user_id: userId,
                      company_name: applicationData.business_name,
                      status: 'pending',
                      submitted_at: new Date().toISOString(),
                      reviewed_at: null,
                      reviewed_by: null,
                      notes: null,
                      application_data: applicationData,
                      updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' }
                  )

                if (error) {
                  const message = error.message || 'Unable to submit your application right now.'
                  setFormError(message)
                  notify({
                    kind: 'error',
                    title: 'Submission failed',
                    message,
                  })
                  return
                }

                setSubmitted(true)
                notify({
                  kind: 'success',
                  title: 'Application submitted',
                  message: 'Your Fireball partner application has been submitted successfully.',
                })
              } finally {
                setSubmitting(false)
              }
            })()
          }}
        >
          {formBlocked && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 backdrop-blur-md">
              <div className="max-w-[520px] mx-auto px-6 text-center">
                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M16 11V8a4 4 0 10-8 0v3m-1 0h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2z"
                    />
                  </svg>
                </div>
                {!authenticated ? (
                  <>
                    <h3 className="text-white text-xl font-semibold">Account required</h3>
                    <p className="mt-2 text-sm text-white/75">
                      Create an account or sign in to access the Fireball certification application form.
                    </p>
                    <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Link
                        to="/account?returnTo=%2Faccount%2Fcompany"
                        className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/account/register?returnTo=%2Faccount%2Fcompany"
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#9f1119] via-[#d21826] to-[#ff3b48] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(214,24,38,0.35)]"
                      >
                        Create account
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-white text-xl font-semibold">Application already in progress</h3>
                    <p className="mt-2 text-sm text-white/75">
                      You already have a Fireball partner application with status{' '}
                      <span className="font-semibold text-white">{applicationStatus}</span>. For updates, please contact
                      our team.
                    </p>
                    <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <a
                        href="mailto:partners@fireballcanada.com?subject=Partner%20Application%20Follow-up"
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#9f1119] via-[#d21826] to-[#ff3b48] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(214,24,38,0.35)]"
                      >
                        Contact us
                      </a>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setAdminFormOverride(true)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-400/10 px-5 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-400/20 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Admin — Show form anyway
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className={formBlocked ? 'pointer-events-none select-none blur-sm' : ''}>
            {isAdmin && adminFormOverride && (
              <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong>Admin override active</strong> — this will overwrite the existing application (upsert on user_id).</span>
              </div>
            )}

          <div className="space-y-8">
            <section>
              <h2 className="text-xs font-nav font-bold uppercase tracking-[0.18em] text-white/65">
                Business Information
              </h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessFields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-[11px] uppercase tracking-[0.14em] text-white/60 mb-2">
                      {field.label}
                    </label>
                    <input
                      name={field.name}
                      type={field.type}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-white/70"
                    />
                  </div>
                ))}
                <div>
                  <LiquidGlassSelect
                    label="Years in Operation"
                    value={yearsOperationValue}
                    options={yearsInOperation.map((option) => ({ value: option, label: option }))}
                    onChange={setYearsOperationValue}
                    placeholder="Select years in operation"
                    searchable={false}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xs font-nav font-bold uppercase tracking-[0.18em] text-white/65">
                Services Offered
              </h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {serviceOptions.map((service) => {
                  const checked = services.includes(service)
                  const serviceId = `service-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                  return (
                    <div
                      key={service}
                      className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 cursor-pointer"
                      onClick={() => {
                        if (checked) {
                          setServices((prev) => prev.filter((item) => item !== service))
                        } else {
                          setServices((prev) => [...prev, service])
                        }
                      }}
                    >
                      <div className="pointer-events-none inline-flex items-center justify-center">
                        <IOSCheckbox
                          id={serviceId}
                          checked={checked}
                          onChange={(nextChecked) => {
                            if (nextChecked) {
                              setServices((prev) => [...prev, service])
                            } else {
                              setServices((prev) => prev.filter((item) => item !== service))
                            }
                          }}
                          color="red"
                          sizeEm={0.88}
                        />
                      </div>
                      <span className="text-sm text-white/90">{service}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            <section>
              <h2 className="text-xs font-nav font-bold uppercase tracking-[0.18em] text-white/65">
                Coating Experience
              </h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <LiquidGlassSelect
                    label="How many ceramic coating installations have you performed?"
                    value={coatingInstallationsValue}
                    options={coatingInstallations.map((option) => ({ value: option, label: option }))}
                    onChange={setCoatingInstallationsValue}
                    placeholder="Select installation volume"
                    searchable={false}
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.14em] text-white/60 mb-2">
                    Which brands have you worked with previously?
                  </label>
                  <input
                    name="previousBrands"
                    type="text"
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-white/70"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xs font-nav font-bold uppercase tracking-[0.18em] text-white/65">
                Operation Details
              </h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="block text-[11px] uppercase tracking-[0.14em] text-white/60 mb-2">
                    Do you operate from a physical location?
                  </p>
                  <div className="flex items-center gap-5 text-sm text-white/85">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="physicalLocation"
                        checked={physicalLocation === 'yes'}
                        onChange={() => setPhysicalLocation('yes')}
                        className="accent-red-500"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="physicalLocation"
                        checked={physicalLocation === 'no'}
                        onChange={() => setPhysicalLocation('no')}
                        className="accent-red-500"
                      />
                      No (Mobile Only)
                    </label>
                  </div>
                </div>
                <div>
                  <LiquidGlassSelect
                    label="How many technicians are in your team?"
                    value={teamSizeValue}
                    options={teamSizes.map((option) => ({ value: option, label: option }))}
                    onChange={setTeamSizeValue}
                    placeholder="Select team size"
                    searchable={false}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xs font-nav font-bold uppercase tracking-[0.18em] text-white/65">Agreement</h2>
              <div
                className="mt-3 inline-flex items-start gap-2.5 text-sm text-white/80 cursor-pointer"
                onClick={() => setAgreementChecked((prev) => !prev)}
              >
                <div className="pointer-events-none mt-0.5">
                  <IOSCheckbox
                    id="partner-agreement-checkbox"
                    checked={agreementChecked}
                    onChange={setAgreementChecked}
                    color="red"
                  />
                </div>
                <span>
                  I understand that Fireball Canada reserves the right to approve or deny this application based on
                  internal certification standards.
                </span>
              </div>
            </section>
          </div>

          <p className="mt-8 text-xs text-white/65">
            Approval includes onboarding support and certification guidance.
          </p>
          {formError && (
            <div className="mt-4 rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
              {formError}
            </div>
          )}
          <button
            type="submit"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#9f1119] via-[#d21826] to-[#ff3b48] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(214,24,38,0.35)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!agreementChecked || submitting}
          >
            {submitting ? 'Submitting...' : 'Apply for Certification'}
          </button>

          <p className="mt-4 text-xs text-white/65">
            Applications are reviewed within 3-5 business days.
            <br />
            Selected partners receive onboarding instructions via email.
          </p>
          </div>
        </form>
      </div>
    </section>
    </>
  )
}
