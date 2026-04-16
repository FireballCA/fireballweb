import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { cn } from '@/lib/utils'

export function PressKit() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null)
  usePageTitle('Brand Assets - Fireball Canada')

  const handleCopyHex = (hex: string) => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard
        .writeText(hex)
        .then(() => {
          setCopiedHex(hex)
          window.setTimeout(() => {
            setCopiedHex((current) => (current === hex ? null : current))
          }, 2000)
        })
        .catch((err) => {
          console.error('Failed to copy colour hex', err)
        })
    }
  }

  return (
    <div className="bg-white text-carbon-900 min-h-screen">
      {/* Hero / intro */}
      <section className="pt-24 pb-12 border-b border-carbon-900/10 px-6 md:px-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-end justify-between gap-8">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-carbon-500 mb-3">Press kit</p>
            <h1 className="font-nav font-bold tracking-tight text-4xl md:text-6xl lg:text-7xl text-carbon-900 leading-[0.9]">
              Fireball
              <br />
              <span className="font-extrabold">Brand</span>{' '}
              <span className="italic text-red-700">system</span>
            </h1>
          </div>
          <div className="text-xs md:text-sm text-carbon-600 space-y-1 md:text-right max-w-xs">
            <p>
              <span className="font-semibold text-carbon-900">Fireball Canada</span> · Official distributor of Fireball Korea.
            </p>
            <p>Logos, colour system, typography, usage &amp; academy.</p>
          </div>
        </div>
      </section>

      {/* Logo system */}
      <section className="py-14 md:py-16 border-b border-carbon-900/10 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <header className="max-w-2xl mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-red-700 mb-2">Logo system</p>
            <h2 className="font-nav text-2xl md:text-3xl font-semibold text-carbon-900 mb-3">
              Primary marks for digital and print.
            </h2>
            <p className="text-sm text-carbon-600">
              Use these logos for all official Fireball Canada communications. Always prefer the vector SVG assets and respect the clear space defined in the brand guide.
            </p>
          </header>

          {/* Full logo row */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-carbon-900/10 pb-3 mb-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-carbon-600">Primary logo</p>
                <p className="text-[11px] text-carbon-500">Fireball full lockup</p>
              </div>
              <div className="grid md:grid-cols-3 border border-carbon-900/10">
                <div className="flex flex-col border-b md:border-b-0 md:border-r border-carbon-900/10">
                <div className="flex-1 flex items-center justify-center bg-white min-h-[160px] px-8 select-none">
                    <img
                      src="/Assets/BrandKIT/Full Logo/Full Logo/Black/RBG (For Digital)/Logo_Black.svg"
                      alt="Fireball Logo – black on white"
                    className="max-h-20 w-auto pointer-events-none"
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-carbon-900/10 text-[11px]">
                    <span className="text-carbon-600">Black on white</span>
                    <span className="font-mono text-[10px] text-carbon-400">SVG · PNG</span>
                  </div>
                </div>

                <div className="flex flex-col border-b md:border-b-0 md:border-r border-carbon-900/10">
                <div className="flex-1 flex items-center justify-center bg-black min-h-[160px] px-8 select-none">
                    <img
                      src="/Assets/BrandKIT/Full Logo/Full Logo/White/RBG (For Digital)/Logo_White.svg"
                      alt="Fireball Logo – white on black"
                    className="max-h-20 w-auto pointer-events-none"
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-carbon-900/10 text-[11px] bg-black">
                    <span className="text-white/60">White on black</span>
                    <span className="font-mono text-[10px] text-white/30">SVG · PNG</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex-1 flex items-center justify-center bg-black min-h-[160px] px-8 select-none">
                    <img
                      src="/LogoFull.avif"
                      alt="Fireball Logo – full-color primary lockup"
                      className="h-10 w-auto max-h-20 object-contain pointer-events-none md:h-12"
                      draggable={false}
                    />
                  </div>
                  <div className="border-t border-carbon-900/10 bg-black px-4 py-3 text-left">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <p className="text-[11px] text-white/70">Full-color lockup</p>
                      <span className="font-mono text-[10px] text-white/30 shrink-0 sm:pt-0.5">AVIF · SVG · PNG</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cropped mark */}
            <div>
              <div className="flex items-center justify-between border-b border-carbon-900/10 pb-3 mb-4 mt-8">
                <p className="text-[10px] uppercase tracking-[0.22em] text-carbon-600">Cropped mark</p>
                <p className="text-[11px] text-carbon-500">Compact icon for tight spaces</p>
              </div>
              <div className="grid md:grid-cols-3 border border-carbon-900/10">
                <div className="flex flex-col border-b md:border-b-0 md:border-r border-carbon-900/10">
                  <div className="flex-1 flex items-center justify-center bg-white min-h-[140px] select-none">
                    <img
                      src="/Assets/BrandKIT/Logo-Croped/Digitial (RGB)/Cropped Mark_Black.svg"
                      alt="Fireball Icon – black"
                      className="max-h-14 w-auto pointer-events-none"
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-carbon-900/10 text-[11px]">
                    <span className="text-carbon-600">Black icon</span>
                    <span className="font-mono text-[10px] text-carbon-400">SVG · PNG</span>
                  </div>
                </div>
                <div className="flex flex-col border-b md:border-b-0 md:border-r border-carbon-900/10">
                  <div className="flex-1 flex items-center justify-center bg-black min-h-[140px] select-none">
                    <img
                      src="/Assets/BrandKIT/Logo-Croped/Digitial (RGB)/Cropped Mark_White.svg"
                      alt="Fireball Icon – white"
                      className="max-h-14 w-auto pointer-events-none"
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-carbon-900/10 text-[11px] bg-black">
                    <span className="text-white/60">White icon</span>
                    <span className="font-mono text-[10px] text-white/30">SVG · PNG</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex-1 flex items-center justify-center bg-white min-h-[140px] select-none">
                    <img
                      src="/Assets/BrandKIT/Logo-Croped/Digitial (RGB)/Cropped Mark_Red.svg"
                      alt="Fireball Icon – red"
                      className="max-h-14 w-auto pointer-events-none"
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-carbon-900/10 text-[11px]">
                    <span className="text-carbon-600">Fireball Red icon</span>
                    <span className="font-mono text-[10px] text-carbon-400">SVG · PNG</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Colour system */}
      <section className="py-14 md:py-16 border-b border-carbon-900/10 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <header className="max-w-2xl mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-red-700 mb-2">Colour system</p>
            <h2 className="font-nav text-2xl md:text-3xl font-semibold text-carbon-900 mb-3">
              Fireball Red, Nappa Blue and supporting tones.
            </h2>
            <p className="text-sm text-carbon-600">
              The Fireball palette is intentionally tight. Use Fireball Red for emphasis and CTAs, Ignite Red for gradients, and Nappa / Dark Nappa for academy and partner materials.
            </p>
          </header>

          <div className="grid md:grid-cols-4 border border-carbon-900/10">
            {[
              {
                name: 'Fireball Red',
                hex: '#9C1B30',
                role: 'Primary brand colour. Logos, key accents, CTAs.',
              },
              {
                name: 'Ignite Red',
                hex: '#D50037',
                role: 'Secondary red for gradients and motion.',
              },
              {
                name: 'Nappa Blue',
                hex: '#1266F0',
                role: 'Academy and partner surfaces.',
              },
              {
                name: 'Dark Nappa',
                hex: '#24356E',
                role: 'Dark backgrounds and overlays.',
              },
            ].map((c) => (
              <div key={c.name} className="border-r last:border-r-0 border-carbon-900/10 presskit-colour-card">
                <div className="h-28 cursor-pointer" style={{ background: c.hex }} onClick={() => handleCopyHex(c.hex)} />
                <div className="px-5 py-4 border-t border-carbon-900/10">
                  <div className="text-sm font-medium text-carbon-900 mb-1">{c.name}</div>
                  <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.18em] text-carbon-500">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.hex }} />
                    {c.hex}
                    <button
                      type="button"
                      className="colour-copy-btn flex items-center justify-center w-6 h-6 rounded border border-carbon-300/70 text-carbon-600 bg-white/80 hover:bg-white"
                      onClick={() => handleCopyHex(c.hex)}
                      aria-label={copiedHex === c.hex ? 'Copied' : 'Copy colour'}
                    >
                      {copiedHex === c.hex ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="mt-2 text-[11px] text-carbon-500">{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logo usage */}
      <section className="py-14 md:py-16 border-b border-carbon-900/10 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <header className="max-w-2xl mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-red-700 mb-2">Logo usage</p>
            <h2 className="font-nav text-2xl md:text-3xl font-semibold text-carbon-900 mb-3">
              How to keep the mark consistent.
            </h2>
            <p className="text-sm text-carbon-600">
              Always use approved logo files. Do not redraw, stretch, or apply effects. When in doubt, use the primary black logo on white or the white logo on black.
            </p>
          </header>

          <div className="grid md:grid-cols-2 border border-carbon-900/10">
            <div className="p-8 border-b md:border-b-0 md:border-r border-carbon-900/10">
              <div className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase bg-emerald-50 text-emerald-700 rounded px-3 py-1 mb-5">
                Do
              </div>
              <ul className="space-y-3 text-sm text-carbon-900">
                <li>Use the supplied SVG logo files for all digital applications.</li>
                <li>Maintain clear space equal to the height of the Fireball “F” around the logo.</li>
                <li>Use Fireball Red only on clean, neutral backgrounds that meet accessibility contrast.</li>
                <li>Prefer the cropped icon only when space does not allow for the full wordmark.</li>
              </ul>
            </div>

            <div className="p-8">
              <div className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase bg-red-50 text-red-700 rounded px-3 py-1 mb-5">
                Don&apos;t
              </div>
              <ul className="space-y-3 text-sm text-carbon-900">
                <li>Don’t add strokes, glows, gradients or shadows to the logo lockups.</li>
                <li>Don’t place the logo over busy photography without sufficient contrast.</li>
                <li>Don’t rotate, skew or otherwise distort the logo.</li>
                <li>Don’t change the colours outside of the approved palette.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="py-14 md:py-16 border-b border-carbon-900/10 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <header className="max-w-2xl mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-red-700 mb-2">Typography</p>
            <h2 className="font-nav text-2xl md:text-3xl font-semibold text-carbon-900 mb-3">Hauser Gothic &amp; Roboto.</h2>
            <p className="text-sm text-carbon-600">
              Hauser Gothic is reserved for display headlines and key brand moments. Roboto is used for all body copy and interface text across Fireball Canada properties.
            </p>
          </header>

          <div className="grid md:grid-cols-2 border border-carbon-900/10">
            <div className="p-10 border-b md:border-b-0 md:border-r border-carbon-900/10">
              <div className="leading-none text-carbon-900 mb-8" style={{ fontFamily: 'Hauser Gothic, system-ui, sans-serif' }}>
                <div className="uppercase tracking-[0.2em] text-3xl md:text-4xl lg:text-5xl">Fireball</div>
                <div className="uppercase tracking-[0.25em] text-lg md:text-xl lg:text-2xl mt-2 text-carbon-700">Canada</div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-[10px] font-mono text-carbon-500 w-10">REG</span>
                  <span className="text-lg text-carbon-900" style={{ fontFamily: 'Hauser Gothic, system-ui, sans-serif' }}>
                    Hauser Gothic
                  </span>
                </div>
              </div>
              <p className="text-sm text-carbon-700 mb-3 font-medium">Hauser Gothic</p>
              <p className="text-xs text-carbon-600 leading-relaxed">
                Used for hero titles, section headers and large typographic compositions. Keep tracking wide and in all caps for the strongest impact.
              </p>
              <p className="mt-4 pt-4 border-t border-carbon-900/10 text-[10px] font-semibold tracking-[0.18em] uppercase text-red-700">
                Display only · Do not substitute
              </p>
            </div>

            <div className="p-10">
              <div className="leading-none text-carbon-900 mb-8">
                <div className="font-black tracking-tight text-3xl md:text-4xl lg:text-5xl">Precision</div>
                <div className="font-black tracking-tight text-lg md:text-xl lg:text-2xl mt-1 text-carbon-700">in every detail</div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-[10px] font-mono text-carbon-500 w-10">300</span>
                  <span className="text-lg text-carbon-900 font-light">Roboto Light</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-[10px] font-mono text-carbon-500 w-10">400</span>
                  <span className="text-lg text-carbon-900 font-normal">Roboto Regular</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-[10px] font-mono text-carbon-500 w-10">500</span>
                  <span className="text-lg text-carbon-900 font-medium">Roboto Medium</span>
                </div>
              </div>
              <p className="text-sm text-carbon-700 mb-3 font-medium">Roboto</p>
              <p className="text-xs text-carbon-600 leading-relaxed">
                Primary UI and body font across Fireball Canada properties. Use Light for long copy, Regular for UI, and Medium for emphasis and buttons.
              </p>
              <p className="mt-4 pt-4 border-t border-carbon-900/10 text-[10px] font-semibold tracking-[0.18em] uppercase text-red-700">
                Body &amp; interface type
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Academy */}
      <section className="py-14 md:py-16 bg-black text-white border-b border-white/10 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <header className="max-w-2xl mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#4a6bc4] mb-2">Fireball Academy</p>
            <h2 className="font-nav text-2xl md:text-3xl font-semibold text-white mb-3">Education-first branding.</h2>
            <p className="text-sm text-white/50">
              Fireball Academy is our training ecosystem for professional installers. Use these dedicated marks and colours whenever you communicate education, training or certification.
            </p>
          </header>

          <div className="max-w-xl border border-white/10 mb-10">
            <div className="flex items-center justify-center bg-black px-8 py-12 min-h-[160px] select-none">
              <img
                src="/Assets/BrandKIT/Academy/Fireball Academy.png"
                alt="Fireball Academy"
                className="max-h-20 w-auto pointer-events-none"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-[11px] bg-black">
              <span className="text-white/60">Fireball Academy</span>
              <span className="font-mono text-[10px] text-white/30">PNG</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 border border-white/10">
            {[
              { name: 'Nappa Blue', hex: '#1266F0' },
              { name: 'Dark Nappa', hex: '#24356E' },
              { name: 'Fireball Red', hex: '#9C1B30' },
            ].map((c) => (
              <div key={c.name} className="border-b md:border-b-0 md:border-r last:border-r-0 border-white/10 presskit-colour-card">
                <div className="h-24 cursor-pointer" style={{ background: c.hex }} onClick={() => handleCopyHex(c.hex)} />
                <div className="px-4 py-4 border-t border-white/10">
                  <div className="text-sm font-medium text-white/80 mb-1">{c.name}</div>
                  <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.18em] text-white/40">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.hex }} />
                    {c.hex}
                    <button
                      type="button"
                      className="colour-copy-btn flex items-center justify-center w-6 h-6 rounded border border-white/30 text-white/70 bg-white/5 hover:bg-white/10"
                      onClick={() => handleCopyHex(c.hex)}
                      aria-label={copiedHex === c.hex ? 'Copied' : 'Copy colour'}
                    >
                      {copiedHex === c.hex ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="mt-2 text-[11px] text-white/30">
                    Academy palette colour.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section className="py-14 md:py-16 bg-carbon-50 px-6 md:px-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-nav text-2xl md:text-3xl font-semibold text-carbon-900 mb-2">
              Download the full press kit.
            </h2>
            <p className="text-sm text-carbon-600 max-w-md">
              Get the complete Fireball Canada brand package in one archive — logos, colour specs, typography, usage examples and Fireball Academy assets.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#" className={cn('inline-flex', appleButtonVisualClassName)}>
              Download
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

