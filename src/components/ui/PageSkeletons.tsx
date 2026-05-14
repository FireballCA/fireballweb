/**
 * PageSkeletons.tsx
 * Un skeleton par type de page — affiché pendant le lazy-load via Suspense.
 * Tous les skeletons "dark" utilisent bg-[#111111] pour matcher le Layout.
 */


// ─── Shared pulse class ──────────────────────────────────────────────────────
const P = 'animate-pulse'
const D = 'bg-white/[0.07]'   // dark surface shimmer
const DH = 'bg-white/[0.12]'  // dark shimmer (more visible)
const L = 'bg-black/[0.07]'   // light surface shimmer
const LH = 'bg-black/[0.12]'  // light shimmer (more visible)

// ─── Home ────────────────────────────────────────────────────────────────────
export function HomeSkeleton() {
  return (
    <div className="w-full bg-[#111111] min-h-screen" aria-hidden>
      {/* Hero */}
      <div className="relative flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: '92vh' }}>
        <div className={`h-3 w-28 rounded-full ${P} ${DH} mb-6`} />
        <div className={`h-12 w-3/4 max-w-lg rounded-xl ${P} ${DH} mb-3`} />
        <div className={`h-12 w-1/2 max-w-sm rounded-xl ${P} ${DH} mb-8`} />
        <div className={`h-4 w-80 rounded-full ${P} ${D} mb-3`} />
        <div className={`h-4 w-64 rounded-full ${P} ${D} mb-10`} />
        <div className="flex gap-3 justify-center">
          <div className={`h-11 w-36 rounded-full ${P} ${DH}`} />
          <div className={`h-11 w-36 rounded-full ${P} ${D}`} />
        </div>
      </div>
      {/* Category lineup */}
      <div className="px-4 pb-20">
        <div className={`h-6 w-48 rounded-lg ${P} ${DH} mx-auto mb-8`} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`aspect-[4/5] rounded-2xl ${P} ${D}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Shop ────────────────────────────────────────────────────────────────────
export function ShopSkeleton() {
  return (
    <div className="w-full bg-[#111111] min-h-screen px-4 py-8" aria-hidden>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-8 max-w-7xl mx-auto overflow-hidden">
        <div className={`h-9 w-32 rounded-full ${P} ${DH} shrink-0`} />
        <div className={`h-9 w-24 rounded-full ${P} ${D} shrink-0`} />
        <div className={`h-9 w-24 rounded-full ${P} ${D} shrink-0`} />
        <div className={`h-9 w-28 rounded-full ${P} ${D} shrink-0`} />
        <div className="ml-auto">
          <div className={`h-9 w-9 rounded-full ${P} ${D}`} />
        </div>
      </div>
      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-7xl mx-auto">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`rounded-2xl overflow-hidden ${P} ${D}`}>
            <div className="aspect-[4/5] w-full bg-white/[0.05]" />
            <div className="p-3 space-y-2">
              <div className={`h-4 w-3/4 rounded ${DH}`} />
              <div className={`h-3 w-1/2 rounded ${D}`} />
              <div className="flex items-center justify-between pt-1">
                <div className={`h-4 w-12 rounded ${DH}`} />
                <div className={`h-7 w-18 rounded-full ${D}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Product detail ──────────────────────────────────────────────────────────
export function ProductSkeleton() {
  return (
    <div className="w-full bg-white min-h-screen" aria-hidden>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className={`h-4 w-48 rounded-full ${P} ${L} mb-8`} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left: images */}
          <div className="space-y-3">
            <div className={`aspect-square w-full rounded-2xl ${P} ${LH}`} />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`h-20 rounded-xl ${P} ${L}`} />
              ))}
            </div>
          </div>
          {/* Right: info */}
          <div className="pt-2 space-y-4">
            <div className={`h-8 w-3/4 rounded-xl ${P} ${LH}`} />
            <div className={`h-6 w-24 rounded-full ${P} ${L}`} />
            <div className="space-y-2">
              <div className={`h-4 w-full rounded ${P} ${L}`} />
              <div className={`h-4 w-5/6 rounded ${P} ${L}`} />
              <div className={`h-4 w-2/3 rounded ${P} ${L}`} />
            </div>
            {/* Variants */}
            <div className="flex gap-2 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`h-10 w-20 rounded-full ${P} ${L}`} />
              ))}
            </div>
            {/* Quantity + CTA */}
            <div className="flex items-center gap-3 pt-2">
              <div className={`h-12 w-28 rounded-full ${P} ${L}`} />
              <div className={`h-12 flex-1 rounded-full ${P} ${LH}`} />
              <div className={`h-12 w-12 rounded-full ${P} ${L}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── About ───────────────────────────────────────────────────────────────────
export function AboutSkeleton() {
  return (
    <div className="w-full bg-[#111111] min-h-screen" aria-hidden>
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 text-center py-28">
        <div className={`h-3 w-24 rounded-full ${P} ${D} mb-6`} />
        <div className={`h-14 w-3/4 max-w-2xl rounded-xl ${P} ${DH} mb-4`} />
        <div className={`h-14 w-1/2 max-w-lg rounded-xl ${P} ${DH} mb-8`} />
        <div className="space-y-2 max-w-xl w-full">
          <div className={`h-4 w-full rounded ${P} ${D}`} />
          <div className={`h-4 w-5/6 rounded ${P} ${D}`} />
          <div className={`h-4 w-4/6 rounded ${P} ${D}`} />
        </div>
      </div>
      {/* Stats row */}
      <div className="flex justify-center gap-12 pb-16 px-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <div className={`h-12 w-28 rounded-xl ${P} ${DH} mx-auto`} />
            <div className={`h-4 w-20 rounded ${P} ${D} mx-auto`} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Academy ─────────────────────────────────────────────────────────────────
export function AcademySkeleton() {
  return (
    <div className="w-full bg-[#111111] min-h-screen" aria-hidden>
      {/* Hero */}
      <div className="relative flex flex-col items-start justify-end px-6 md:px-16 pb-16" style={{ minHeight: '60vh' }}>
        <div className={`h-3 w-20 rounded-full ${P} ${D} mb-4`} />
        <div className={`h-12 w-2/3 rounded-xl ${P} ${DH} mb-3`} />
        <div className={`h-5 w-1/2 rounded ${P} ${D} mb-6`} />
        <div className="flex gap-3">
          <div className={`h-10 w-36 rounded-full ${P} ${DH}`} />
          <div className={`h-10 w-28 rounded-full ${P} ${D}`} />
        </div>
      </div>
      {/* Training cards */}
      <div className="px-4 md:px-16 pb-20">
        <div className={`h-6 w-48 rounded-lg ${P} ${DH} mb-6`} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`rounded-2xl overflow-hidden ${P} ${D}`}>
              <div className="aspect-video bg-white/[0.05]" />
              <div className="p-4 space-y-2">
                <div className={`h-5 w-3/4 rounded ${DH}`} />
                <div className={`h-4 w-1/2 rounded ${D}`} />
                <div className={`h-4 w-2/3 rounded ${D}`} />
                <div className={`h-9 w-full rounded-full ${DH} mt-3`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Contact ─────────────────────────────────────────────────────────────────
export function ContactSkeleton() {
  return (
    <div className="w-full bg-white min-h-screen" aria-hidden>
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-6">
        <div className={`h-8 w-48 rounded-xl ${P} ${LH}`} />
        <div className={`h-4 w-80 rounded ${P} ${L}`} />
        <div className="space-y-4 pt-4">
          <div className={`h-12 w-full rounded-xl ${P} ${L}`} />
          <div className={`h-12 w-full rounded-xl ${P} ${L}`} />
          <div className={`h-12 w-full rounded-xl ${P} ${L}`} />
          <div className={`h-36 w-full rounded-xl ${P} ${L}`} />
          <div className={`h-12 w-full rounded-full ${P} ${LH}`} />
        </div>
      </div>
    </div>
  )
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export function CartSkeleton() {
  return (
    <div className="w-full bg-[#111111] min-h-screen px-4 py-12" aria-hidden>
      <div className="max-w-5xl mx-auto">
        <div className={`h-8 w-24 rounded-xl ${P} ${DH} mb-10`} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`flex gap-4 rounded-2xl p-4 ${P} ${D}`}>
                <div className={`h-24 w-24 rounded-xl bg-white/[0.05] shrink-0`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-5 w-3/4 rounded ${DH}`} />
                  <div className={`h-4 w-1/4 rounded ${D}`} />
                  <div className={`h-4 w-16 rounded ${D}`} />
                </div>
              </div>
            ))}
          </div>
          {/* Summary */}
          <div className={`rounded-2xl p-5 ${P} ${D} space-y-3 h-fit`}>
            <div className={`h-5 w-32 rounded ${DH}`} />
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <div className={`h-4 w-20 rounded ${D}`} />
                <div className={`h-4 w-16 rounded ${DH}`} />
              </div>
              <div className="flex justify-between">
                <div className={`h-4 w-24 rounded ${D}`} />
                <div className={`h-4 w-16 rounded ${D}`} />
              </div>
            </div>
            <div className={`h-11 w-full rounded-full bg-white/[0.15] mt-4`} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Account / Login ─────────────────────────────────────────────────────────
export function AccountSkeleton() {
  return (
    <div className="w-full bg-white min-h-screen flex items-center justify-center px-6" aria-hidden>
      <div className="w-full max-w-sm space-y-4">
        <div className={`h-10 w-32 rounded-xl ${P} ${LH} mx-auto mb-6`} />
        <div className={`h-12 w-full rounded-xl ${P} ${L}`} />
        <div className={`h-12 w-full rounded-xl ${P} ${L}`} />
        <div className={`h-12 w-full rounded-full ${P} ${LH}`} />
        <div className={`h-4 w-48 rounded ${P} ${L} mx-auto`} />
      </div>
    </div>
  )
}

// ─── CarClub ─────────────────────────────────────────────────────────────────
export function CarClubSkeleton() {
  return (
    <div className="w-full bg-black min-h-screen" aria-hidden>
      <div className="flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: '70vh' }}>
        <div className={`h-3 w-24 rounded-full ${P} ${DH} mb-5`} />
        <div className={`h-12 w-3/4 max-w-xl rounded-xl ${P} ${DH} mb-3`} />
        <div className={`h-5 w-64 rounded ${P} ${D} mb-8`} />
        <div className={`h-11 w-40 rounded-full ${P} ${DH}`} />
      </div>
      <div className="px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`rounded-2xl aspect-[4/5] ${P} ${D}`} />
        ))}
      </div>
    </div>
  )
}

// ─── Event list ──────────────────────────────────────────────────────────────
export function EventSkeleton() {
  return (
    <div className="w-full bg-[#111111] min-h-screen px-4 py-12" aria-hidden>
      <div className="max-w-5xl mx-auto">
        <div className={`h-8 w-40 rounded-xl ${P} ${DH} mb-8`} />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`flex gap-4 rounded-2xl overflow-hidden ${P} ${D}`}>
              <div className={`h-40 w-48 shrink-0 bg-white/[0.05]`} />
              <div className="flex-1 py-4 pr-4 space-y-2">
                <div className={`h-3 w-20 rounded ${D}`} />
                <div className={`h-6 w-3/4 rounded-lg ${DH}`} />
                <div className={`h-4 w-1/2 rounded ${D}`} />
                <div className={`h-4 w-1/3 rounded ${D}`} />
                <div className={`h-9 w-28 rounded-full ${DH} mt-2`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Legal / Privacy / Terms / Cookies ───────────────────────────────────────
export function LegalSkeleton() {
  return (
    <div className="w-full bg-white min-h-screen px-6 py-16" aria-hidden>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className={`h-9 w-72 rounded-xl ${P} ${LH}`} />
        <div className={`h-4 w-40 rounded ${P} ${L}`} />
        <div className="pt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-4 rounded ${P} ${L}`} style={{ width: `${[100,95,88,100,75,90][i]}%` }} />
          ))}
        </div>
        <div className={`h-6 w-56 rounded-lg ${P} ${LH} mt-6`} />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-4 rounded ${P} ${L}`} style={{ width: `${[100,92,85,97,70][i]}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Service Builder ─────────────────────────────────────────────────────────
export function ServiceBuilderSkeleton() {
  return (
    <div className="w-full bg-[#111111] min-h-screen px-4 py-10" aria-hidden>
      <div className="max-w-4xl mx-auto">
        <div className={`h-8 w-60 rounded-xl ${P} ${DH} mb-2`} />
        <div className={`h-4 w-96 rounded ${P} ${D} mb-8`} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`rounded-2xl overflow-hidden ${P} ${D}`}>
              <div className="aspect-[4/3] bg-white/[0.05]" />
              <div className="p-3 space-y-2">
                <div className={`h-4 w-2/3 rounded ${DH}`} />
                <div className={`h-3 w-1/2 rounded ${D}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Partner / Join ──────────────────────────────────────────────────────────
export function PartnerSkeleton() {
  return (
    <div className="w-full bg-[#111111] min-h-screen" aria-hidden>
      <div className="flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: '55vh' }}>
        <div className={`h-3 w-20 rounded-full ${P} ${D} mb-5`} />
        <div className={`h-12 w-3/4 max-w-xl rounded-xl ${P} ${DH} mb-4`} />
        <div className="space-y-2 max-w-md w-full mb-8">
          <div className={`h-4 w-full rounded ${P} ${D}`} />
          <div className={`h-4 w-5/6 rounded ${P} ${D}`} />
        </div>
        <div className={`h-11 w-44 rounded-full ${P} ${DH}`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto px-4 pb-20">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`rounded-2xl p-5 ${P} ${D} space-y-2`}>
            <div className={`h-8 w-8 rounded-full ${DH}`} />
            <div className={`h-5 w-32 rounded ${DH}`} />
            <div className={`h-4 w-full rounded ${D}`} />
            <div className={`h-4 w-5/6 rounded ${D}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Generic fallback ────────────────────────────────────────────────────────
export function GenericDarkSkeleton() {
  return (
    <div className="w-full bg-[#111111] min-h-screen px-6 py-16" aria-hidden>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className={`h-10 w-64 rounded-xl ${P} ${DH}`} />
        <div className={`h-4 w-96 max-w-full rounded ${P} ${D}`} />
        <div className="pt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`h-4 rounded ${P} ${D}`} style={{ width: `${[100,88,94,75][i]}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
