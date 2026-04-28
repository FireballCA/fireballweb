import { usePageTitle } from '@/hooks/usePageTitle'

export function Cookies() {
  usePageTitle('Cookies - Fireball Canada')
  return (
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
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They allow the site to remember your actions and preferences over a period of time, so you do not have to re-enter them each time you visit.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">How We Use Cookies</h2>
            <p>Fireball Canada uses cookies for the following purposes:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-carbon-900">Essential cookies</strong> — required for the website to function correctly (e.g., session management, authentication).</li>
              <li><strong className="text-carbon-900">Analytics cookies</strong> — help us understand how visitors interact with the site so we can improve it.</li>
              <li><strong className="text-carbon-900">Preference cookies</strong> — remember your settings and choices to personalize your experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Third-Party Cookies</h2>
            <p>Some pages may include content from third-party services (such as analytics or payment processors) that may set their own cookies. Fireball Canada does not control these cookies and encourages you to review the privacy policies of those third parties.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Managing Cookies</h2>
            <p>You can manage or disable cookies at any time through your browser settings. Please note that disabling certain cookies may affect the functionality of the website.</p>
            <p className="mt-4">For guidance on managing cookies, refer to your browser's help documentation.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Contact</h2>
            <p>If you have questions about our use of cookies, contact us at <a href="mailto:fireballcanada@gmail.com" className="text-[#B61B1B] hover:underline">fireballcanada@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
