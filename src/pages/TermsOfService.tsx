import { usePageTitle } from '@/hooks/usePageTitle'

export function TermsOfService() {
  usePageTitle('Terms of Service - Fireball Canada')
  return (
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
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Acceptance of Terms</h2>
            <p>By accessing or using the Fireball Canada website and services, you agree to be bound by these Terms of Service. If you do not agree, please refrain from using our platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Permitted Use</h2>
            <p>You agree to use this website solely for lawful purposes. You must not:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>Attempt to gain unauthorized access to any part of the platform</li>
              <li>Disrupt or interfere with the website's security or infrastructure</li>
              <li>Copy, reproduce, or distribute content without prior written permission</li>
              <li>Use automated tools to scrape or harvest data from the website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Products and Services</h2>
            <p>Fireball Canada provides automotive protection products and services. While we strive to ensure accuracy in product descriptions, pricing, and availability, we reserve the right to modify or discontinue any product or service without prior notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Orders and Payments</h2>
            <p>All purchases are subject to product availability and order confirmation. Fireball Canada reserves the right to cancel or refuse any order in cases of suspected fraud, pricing errors, or stock unavailability. Payment processing may be handled by third-party providers.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Limitation of Liability</h2>
            <p>Fireball Canada shall not be held liable for any indirect, incidental, or consequential damages arising from the use of our products or services. Users are responsible for following all provided product instructions.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Modifications to Terms</h2>
            <p>We reserve the right to update these Terms of Service at any time. Changes take effect upon publication on this page. We encourage you to review this page periodically.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Governing Law</h2>
            <p>These terms are governed by the laws of Canada. Any dispute shall be subject to the exclusive jurisdiction of the competent Canadian courts.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Contact</h2>
            <p>For any questions regarding these terms, contact us at <a href="mailto:fireballcanada@gmail.com" className="text-[#B61B1B] hover:underline">fireballcanada@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
