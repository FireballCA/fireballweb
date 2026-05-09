import { usePageTitle } from '@/hooks/usePageTitle'
import { SEO } from '@/components/SEO'

export function LegalNotice() {
  usePageTitle('Legal Notice - Fireball Canada')
  return (
    <>
      <SEO title="Legal Notice — Fireball Canada" rawTitle description="Legal notice and corporate information for Fireball Canada." canonicalPath="/Legal-Notice" />
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
            <p>
              This website is operated by <strong className="text-carbon-900">Passion Detailing</strong> ("Fireball Canada", "Passion du détail", "Passion Detailing", "we", "us", or "our").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Business Information</h2>
            <div className="space-y-1">
              <p className="font-semibold text-carbon-900">Fireball Canada</p>
              <p>Passion du détail INC</p>
              <p>8007 Av. Émilien-Letarte</p>
              <p>Saint-Hyacinthe, QC, J2R 0A4, Canada</p>
              <p className="mt-2">
                Email:{' '}
                <a href="mailto:info@passiondetailing.ca" className="text-[#B61B1B] hover:underline">
                  info@passiondetailing.ca
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Purpose of the Website</h2>
            <p>
              This website provides access to automotive detailing products, services, training programs, membership systems, and related digital tools, including account management, vehicle tracking, and installer services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Intellectual Property</h2>
            <p>
              All content on this website, including but not limited to text, graphics, logos, icons, images, videos, software, and design elements, is the exclusive property of Fireball Canada or its licensors and is protected by Canadian and international intellectual property laws.
            </p>
            <p className="mt-4">
              No part of this website may be copied, reproduced, distributed, or used without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Accuracy of Information</h2>
            <p>
              We strive to ensure that all information provided on this website is accurate and up to date. However, we do not guarantee the completeness, reliability, or accuracy of any information. Content may be updated or modified at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Limitation of Liability</h2>
            <p>Fireball Canada shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>the use or inability to use the website</li>
              <li>errors or omissions in content</li>
              <li>reliance on any information provided</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">External Links</h2>
            <p>
              This website may include links to third-party websites. Fireball Canada is not responsible for the content, policies, or practices of any third-party sites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Governing Law</h2>
            <p>
              This website is governed by the laws of the Province of Quebec and the applicable laws of Canada.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">Contact</h2>
            <p>For any legal inquiries, please contact:</p>
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
