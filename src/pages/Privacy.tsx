import { usePageTitle } from '@/hooks/usePageTitle'

export function Privacy() {
  usePageTitle('Privacy Policy - Fireball Canada')
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-carbon-500 mb-3">Legal Center</p>
          <h1 className="font-sans text-4xl md:text-5xl font-bold text-carbon-900 tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-carbon-500 text-sm">Last updated: April 2026</p>
        </div>

        <div className="space-y-10 font-sans text-base leading-relaxed text-carbon-600">
          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Introduction</h2>
            <p>Fireball Canada is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Data We Collect</h2>
            <p>We may collect the following personal information:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>Full name and email address</li>
              <li>Account credentials</li>
              <li>Order history and billing information</li>
              <li>Vehicle information (if provided through the platform)</li>
              <li>Usage data and browsing behavior on our website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">How We Use Your Data</h2>
            <p>Your personal data is used to:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>Operate and maintain the platform</li>
              <li>Process orders and manage your account</li>
              <li>Send transactional and service-related communications</li>
              <li>Improve our products, services, and user experience</li>
              <li>Comply with applicable legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Data Sharing</h2>
            <p>We do not sell your personal data to third parties. We may share data with trusted service providers (payment processors, hosting services) strictly for operational purposes and under confidentiality agreements.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Data Retention</h2>
            <p>We retain personal data only as long as necessary to fulfill the purposes described in this policy or as required by law.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Your Rights</h2>
            <p>You have the right to access, correct, or request deletion of your personal data at any time. To exercise these rights, contact us at the address below.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Contact</h2>
            <p>For any privacy-related inquiries, contact us at <a href="mailto:fireballcanada@gmail.com" className="text-[#B61B1B] hover:underline">fireballcanada@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
