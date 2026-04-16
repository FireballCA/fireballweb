import { usePageTitle } from '@/hooks/usePageTitle'

export function Legal() {
  usePageTitle('Legal - Fireball Canada')
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-carbon-900 tracking-tight mb-3">
            Legal
          </h1>
          <p className="text-carbon-600 text-sm">
            Last updated: March 2026
          </p>
        </div>

        {/* Content */}
        <div className="max-w-none space-y-12">
          {/* Introduction */}
          <section>
            <h2 className="font-sans text-2xl md:text-3xl font-bold text-carbon-900 mb-4">Introduction</h2>
            <div className="text-carbon-600 space-y-4 text-base leading-relaxed font-sans">
            <p>
              Welcome to Fireball Canada.
            </p>
            <p>
              These legal terms govern your use of the Fireball Canada website, services, and products. By accessing or using our platform, you agree to comply with the terms outlined on this page.
            </p>
            <p>
              If you do not agree with these terms, please refrain from using our website or services.
            </p>
          </div>
        </section>

          {/* Terms of Use */}
          <section>
            <h2 className="font-sans text-2xl md:text-3xl font-bold text-carbon-900 mb-4">Terms of Use</h2>
            <div className="text-carbon-600 space-y-4 text-base leading-relaxed font-sans">
            <p>
              By using this website, you agree to use it only for lawful purposes.
            </p>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>misuse the platform or attempt to gain unauthorized access</li>
              <li>disrupt or interfere with the website's security or infrastructure</li>
              <li>copy, reproduce, or distribute content without permission</li>
            </ul>
            <p>
              Fireball Canada reserves the right to restrict or terminate access to users who violate these terms.
            </p>
          </div>
        </section>

          {/* Products and Services */}
          <section>
            <h2 className="font-sans text-2xl md:text-3xl font-bold text-carbon-900 mb-4">Products and Services</h2>
            <div className="text-carbon-600 space-y-4 text-base leading-relaxed font-sans">
            <p>
              Fireball Canada provides automotive protection products and related services.
            </p>
            <p>
              While we strive to ensure product descriptions, specifications, and availability are accurate, we cannot guarantee that all information is completely free of errors.
            </p>
            <p>We reserve the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>modify product information</li>
              <li>update pricing</li>
              <li>discontinue products without prior notice</li>
            </ul>
          </div>
        </section>

          {/* Orders and Payments */}
          <section>
            <h2 className="font-sans text-2xl md:text-3xl font-bold text-carbon-900 mb-4">Orders and Payments</h2>
            <div className="text-carbon-600 space-y-4 text-base leading-relaxed font-sans">
            <p>
              All purchases made through our platform are subject to product availability and order acceptance.
            </p>
            <p>
              Fireball Canada reserves the right to cancel or refuse any order if necessary, including cases of:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>suspected fraud</li>
              <li>pricing errors</li>
              <li>product availability issues</li>
            </ul>
            <p>
              Payment processing may be handled by third-party providers.
            </p>
          </div>
        </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="font-sans text-2xl md:text-3xl font-bold text-carbon-900 mb-4">Intellectual Property</h2>
            <div className="text-carbon-600 space-y-4 text-base leading-relaxed font-sans">
            <p>
              All content on this website is the property of Fireball Canada or its partners.
            </p>
            <p>This includes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>logos</li>
              <li>branding</li>
              <li>product names</li>
              <li>images</li>
              <li>website design</li>
              <li>written content</li>
            </ul>
            <p>
              No content may be copied, reproduced, or distributed without prior written permission.
            </p>
          </div>
        </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="font-sans text-2xl md:text-3xl font-bold text-carbon-900 mb-4">Limitation of Liability</h2>
            <div className="text-carbon-600 space-y-4 text-base leading-relaxed font-sans">
            <p>
              Fireball Canada shall not be held liable for any damages resulting from the use of our products or services, including but not limited to indirect, incidental, or consequential damages.
            </p>
            <p>
              Users are responsible for using products according to the instructions provided.
            </p>
          </div>
        </section>

          {/* Privacy */}
          <section>
            <h2 className="font-sans text-2xl md:text-3xl font-bold text-carbon-900 mb-4">Privacy</h2>
            <div className="text-carbon-600 space-y-4 text-base leading-relaxed font-sans">
            <p>
              Fireball Canada respects your privacy and is committed to protecting your personal information.
            </p>
            <p>Information collected may include:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>name</li>
              <li>email address</li>
              <li>account information</li>
              <li>order history</li>
              <li>vehicle information (if provided through the platform)</li>
            </ul>
            <p>
              This information is used to operate the platform, process orders, and improve services.
            </p>
            <p>
              We do not sell personal data to third parties.
            </p>
          </div>
        </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="font-sans text-2xl md:text-3xl font-bold text-carbon-900 mb-4">Third-Party Services</h2>
            <div className="text-carbon-600 space-y-4 text-base leading-relaxed font-sans">
            <p>
              Our website may integrate services from third parties such as payment processors or analytics tools.
            </p>
            <p>
              These services operate under their own terms and privacy policies.
            </p>
            <p>
              Fireball Canada is not responsible for the practices of third-party services.
            </p>
          </div>
        </section>

          {/* Modifications */}
          <section>
            <h2 className="font-sans text-2xl md:text-3xl font-bold text-carbon-900 mb-4">Modifications</h2>
            <div className="text-carbon-600 space-y-4 text-base leading-relaxed font-sans">
            <p>
              Fireball Canada reserves the right to update or modify these legal terms at any time.
            </p>
            <p>
              Changes will take effect once published on this page.
            </p>
            <p>
              We encourage users to review this page periodically.
            </p>
          </div>
        </section>

          {/* Contact */}
          <section>
            <h2 className="font-sans text-2xl md:text-3xl font-bold text-carbon-900 mb-4">Contact</h2>
            <div className="text-carbon-600 space-y-4 text-base leading-relaxed font-sans">
              <p>
                For legal inquiries or questions regarding these terms, please contact:
              </p>
              <div className="mt-4 space-y-2">
                <p className="font-semibold text-carbon-900">Fireball Canada</p>
                <p>
                  <a 
                    href="mailto:fireballcanada@gmail.com" 
                    className="text-[#B61B1B] hover:text-[#B61B1B]/80 transition-colors underline"
                  >
                    fireballcanada@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
