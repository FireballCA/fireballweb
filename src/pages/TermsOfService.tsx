import { usePageTitle } from '@/hooks/usePageTitle'
import { SEO } from '@/components/SEO'

export function TermsOfService() {
  usePageTitle('Terms of Service - Fireball Canada')
  return (
    <>
      <SEO title="Terms of Service — Fireball Canada" rawTitle description="Terms of service governing the use of Fireball Canada website and products." canonicalPath="/Terms-of-Service" />
      <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-carbon-500 mb-3">Legal Center</p>
          <h1 className="font-sans text-4xl md:text-5xl font-bold text-carbon-900 tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-carbon-500 text-sm">Last updated: April 2026</p>
        </div>

        <div className="space-y-10 font-sans text-base leading-relaxed text-carbon-600">
          <section>
            <p>
              By accessing or using this website, you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Eligibility</h2>
            <p>
              You must be at least the age of majority in your jurisdiction to use this website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Use of Services</h2>
            <p>
              You agree to use the website and its services only for lawful purposes. You must not misuse the platform or attempt to interfere with its operation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Products and Services</h2>
            <p>
              All products and services are subject to availability. We reserve the right to limit quantities, refuse orders, or discontinue products at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Pricing and Payments</h2>
            <p>
              All prices are listed in CAD and are subject to change without notice. We reserve the right to correct pricing errors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Orders and Cancellations</h2>
            <p>
              We reserve the right to refuse or cancel any order for any reason, including suspected fraud or errors in product information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Returns and Refunds</h2>
            <p>
              Return and refund policies are governed by our separate Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">User Content</h2>
            <p>
              By submitting reviews, images, or other content, you grant Fireball Canada a non-exclusive, royalty-free license to use, modify, and display such content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Limitation of Liability</h2>
            <p>
              Fireball Canada shall not be liable for any indirect, incidental, or consequential damages resulting from the use of our services or products.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Membership and Digital Features</h2>
            <p>
              Certain features, including memberships, tiers, and rewards systems, may be subject to additional conditions and may be modified or discontinued at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Termination</h2>
            <p>
              We reserve the right to suspend or terminate access to our services for violations of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Province of Quebec and Canada.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Changes to Terms</h2>
            <p>
              We may update these Terms at any time. Continued use of the website constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Contact</h2>
            <p>For any questions regarding these Terms, contact us at:</p>
            <div className="mt-3 space-y-1">
              <p>
                <a href="mailto:fireballcarcarecanada@gmail.com" className="text-[#B61B1B] hover:underline">
                  fireballcarcarecanada@gmail.com
                </a>
              </p>
              <p>
                <a href="mailto:info@passiondetailing.ca" className="text-[#B61B1B] hover:underline">
                  info@passiondetailing.ca
                </a>{' '}
                <span className="text-carbon-500">(Object : Fireball Canada)</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
    </>
  )
}
