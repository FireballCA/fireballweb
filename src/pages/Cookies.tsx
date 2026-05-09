import { usePageTitle } from '@/hooks/usePageTitle'
import { SEO } from '@/components/SEO'

export function Cookies() {
  usePageTitle('Cookies - Fireball Canada')
  return (
    <>
      <SEO title="Cookie Policy — Fireball Canada" rawTitle description="Fireball Canada cookie policy. Information about how we use cookies on this website." canonicalPath="/Cookies" />
      <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-carbon-500 mb-3">Legal Center</p>
          <h1 className="font-sans text-4xl md:text-5xl font-bold text-carbon-900 tracking-tight mb-3">
            Cookie Policy
          </h1>
          <p className="text-carbon-500 text-sm">Last updated: April 2026</p>
        </div>

        <div className="space-y-10 font-sans text-base leading-relaxed text-carbon-600">
          <section>
            <p>
              This Cookies Policy explains how Fireball Canada uses cookies and similar technologies when you visit our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">What Are Cookies</h2>
            <p>
              Cookies are small data files stored on your device when you access a website. They allow websites to recognize your device and store certain information about your preferences or actions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">How We Use Cookies</h2>
            <p>We use cookies to:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>ensure proper functioning of the website</li>
              <li>enhance user experience</li>
              <li>analyze website traffic and usage patterns</li>
              <li>remember user preferences</li>
              <li>improve performance and security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Types of Cookies We Use</h2>

            <div className="space-y-6 mt-2">
              <div>
                <h3 className="text-lg font-semibold text-carbon-900 mb-2">Essential Cookies</h3>
                <p>These cookies are necessary for the website to function properly and cannot be disabled.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-carbon-900 mb-2">Performance and Analytics Cookies</h3>
                <p>These cookies help us understand how users interact with our website by collecting anonymous information such as page visits and traffic sources.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-carbon-900 mb-2">Functional Cookies</h3>
                <p>These cookies allow us to remember your preferences, such as language or account settings.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-carbon-900 mb-2">Marketing Cookies</h3>
                <p>We may use cookies to deliver relevant advertisements or track campaign performance.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Third-Party Cookies</h2>
            <p>
              We may use third-party services such as analytics providers or embedded content (e.g., videos, social media), which may place cookies on your device.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Managing Cookies</h2>
            <p>
              You can manage or disable cookies through your browser settings. Please note that disabling certain cookies may impact website functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Consent</h2>
            <p>
              By continuing to use our website, you consent to the use of cookies in accordance with this policy.
            </p>
          </section>
        </div>
      </div>
    </div>
    </>
  )
}
