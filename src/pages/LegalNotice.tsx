import { usePageTitle } from '@/hooks/usePageTitle'

export function LegalNotice() {
  usePageTitle('Legal Notice - Fireball Canada')
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-carbon-500 mb-3">Legal Center</p>
          <h1 className="font-sans text-4xl md:text-5xl font-bold text-carbon-900 tracking-tight mb-3">
            Legal Notice
          </h1>
          <p className="text-carbon-500 text-sm">Last updated: April 2026</p>
        </div>

        <div className="space-y-10 font-sans text-base leading-relaxed text-carbon-600">
          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Publisher</h2>
            <p>This website is published by <strong className="text-carbon-900">Fireball Canada</strong>, a company operating under Canadian law.</p>
            <div className="mt-4 space-y-1">
              <p>Email: <a href="mailto:fireballcanada@gmail.com" className="text-[#B61B1B] hover:underline">fireballcanada@gmail.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Hosting</h2>
            <p>This website is hosted by a third-party provider. Fireball Canada is not responsible for the technical infrastructure beyond what falls under its direct editorial control.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Intellectual Property</h2>
            <p>All content on this website — including logos, branding, product names, images, design, and written content — is the exclusive property of Fireball Canada or its partners and is protected by applicable intellectual property laws.</p>
            <p className="mt-4">No reproduction, distribution, or commercial use is permitted without prior written consent from Fireball Canada.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Limitation of Liability</h2>
            <p>Fireball Canada makes every effort to ensure the accuracy of information published on this website. However, we cannot guarantee that all information is free of errors or omissions, and we reserve the right to update content at any time without notice.</p>
            <p className="mt-4">Fireball Canada shall not be held liable for any damages arising from the use of or reliance on the information published on this site.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Governing Law</h2>
            <p>This legal notice is governed by Canadian law. Any dispute arising from the use of this website shall be subject to the exclusive jurisdiction of the competent Canadian courts.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Contact</h2>
            <p>For any legal inquiries, please contact us at <a href="mailto:fireballcanada@gmail.com" className="text-[#B61B1B] hover:underline">fireballcanada@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
