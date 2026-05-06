/**
 * Skeleton that mirrors the exact layout of AccountDashboard:
 *  - Mobile  (lg:hidden) : XP hero + dark bottom sheet grid
 *  - Desktop (hidden lg:block) : MemberStatusHero + 2-row card grid
 */
export function AccountDashboardSkeleton() {
  return (
    <>
      {/* ─────────────── MOBILE SKELETON ─────────────── */}
      <div
        className="lg:hidden w-full bg-white"
        style={{ height: '100dvh', overflow: 'hidden' }}
        aria-hidden
      >
        {/* White XP hero (top 324px) */}
        <div
          className="flex flex-col items-center justify-center gap-3 px-4"
          style={{ height: 324, paddingTop: 'max(12px, env(safe-area-inset-top, 0px))' }}
        >
          <div className="h-14 w-36 animate-pulse rounded-xl bg-[#EBEBEB]" />
          <div className="h-1 w-28 animate-pulse rounded-full bg-[#E2E2E2]" />
        </div>

        {/* Dark bottom sheet */}
        <div
          className="flex flex-col rounded-t-[28px]"
          style={{ background: '#1a1a1a', height: 'calc(100dvh - 324px)' }}
        >
          {/* Badge area */}
          <div className="flex flex-col items-center pt-5 pb-4 gap-3">
            <div className="h-1 w-10 rounded-full bg-white/20 animate-pulse" />
            <div className="h-36 w-36 animate-pulse rounded-full bg-white/10 mt-1" />
            <div className="flex items-center gap-4 mt-1">
              <div className="h-5 w-5 animate-pulse rounded-full bg-white/15" />
              <div className="h-4 w-24 animate-pulse rounded-md bg-white/15" />
              <div className="h-5 w-5 animate-pulse rounded-full bg-white/15" />
            </div>
          </div>

          {/* Action grid (2 × 3) */}
          <div className="px-5 mt-2 grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-white/[0.07]"
                style={{ height: 80 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────── DESKTOP SKELETON ─────────────── */}
      <div className="hidden lg:block w-full bg-white" aria-hidden>

        {/* ── Hero (mirrors MemberStatusHero: min-h-[88vh]) ── */}
        <section className="relative w-full overflow-hidden" style={{ minHeight: '88vh' }}>
          {/* Top bar: name + icon buttons */}
          <div className="flex items-center justify-between gap-4 px-6 pt-8 md:px-12 lg:px-16">
            <div className="h-10 w-56 animate-pulse rounded-xl bg-[#EBEBEB]" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-[#EBEBEB]" />
              <div className="h-9 w-9 animate-pulse rounded-xl bg-[#EBEBEB]" />
            </div>
          </div>

          {/* 3-col center grid (mirrors UserIdentity | ProgressBar | Benefits) */}
          <div
            className="px-16 grid items-start"
            style={{
              marginTop: '22vh',
              gridTemplateColumns: '240px 1fr 240px',
              gap: '2rem',
            }}
          >
            {/* Left: quick-link rows */}
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-[#F3F3F3] px-4 py-3">
                  <div className="h-8 w-8 animate-pulse rounded-lg bg-[#E2E2E2] shrink-0" />
                  <div className="h-3.5 flex-1 animate-pulse rounded bg-[#E2E2E2]" />
                </div>
              ))}
            </div>

            {/* Center: XP ring + progress bar */}
            <div className="flex flex-col items-center gap-5">
              <div className="h-36 w-36 animate-pulse rounded-full bg-[#EBEBEB]" />
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-16 animate-pulse rounded bg-[#EBEBEB]" />
                  <div className="h-3 w-20 animate-pulse rounded bg-[#EBEBEB]" />
                </div>
                <div className="h-1.5 w-full animate-pulse rounded-full bg-[#EBEBEB]" />
              </div>
            </div>

            {/* Right: tier + benefits */}
            <div className="flex flex-col items-end gap-2.5">
              <div className="h-3 w-12 animate-pulse rounded bg-[#EBEBEB]" />
              <div className="h-5 w-36 animate-pulse rounded-lg bg-[#EBEBEB]" />
              <div className="mt-3 w-full space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 justify-end">
                    <div className="h-3 animate-pulse rounded bg-[#EBEBEB]" style={{ width: `${60 + i * 8}px` }} />
                    <div className="h-3 w-3 animate-pulse rounded-sm bg-[#E2E2E2] shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Content cards (mirrors hidden lg:block section) ── */}
        <section className="w-full bg-white px-6 md:px-12 lg:px-16 py-10 md:py-14">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">

            {/* Row 1: Academy | Notifications */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Academy training card */}
              <div className="rounded-2xl bg-[#F3F3F3] px-6 py-6 md:px-8 md:py-8">
                <div className="flex items-center justify-between mb-5">
                  <div className="h-3 w-36 animate-pulse rounded bg-[#DCDCDC]" />
                  <div className="h-3 w-24 animate-pulse rounded bg-[#DCDCDC]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-2">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-[#EBEBEB]" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-[#EBEBEB]" />
                      <div className="mt-3 h-5 w-20 animate-pulse rounded-full bg-[#EBEBEB]" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications card */}
              <div className="rounded-2xl bg-[#F3F3F3] px-6 py-6 md:px-8 md:py-8">
                <div className="flex items-center justify-between mb-5">
                  <div className="h-3 w-28 animate-pulse rounded bg-[#DCDCDC]" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-[#E8E8E8] bg-white px-3 py-3 space-y-1.5">
                      <div className="h-3 animate-pulse rounded bg-[#EBEBEB]" style={{ width: `${55 + i * 10}%` }} />
                      <div className="h-2.5 w-4/5 animate-pulse rounded bg-[#EBEBEB]" />
                      <div className="h-2 w-16 animate-pulse rounded bg-[#EBEBEB]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Orders | (Garage + Leaderboard) */}
            <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
              {/* Orders card */}
              <div className="rounded-2xl bg-[#F3F3F3] px-6 py-6 md:px-8 md:py-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-3 w-16 animate-pulse rounded bg-[#DCDCDC]" />
                  <div className="h-3 w-24 animate-pulse rounded bg-[#DCDCDC]" />
                </div>
                {/* Order summary box */}
                <div className="rounded-2xl border border-[#E2E2E2] bg-white p-4">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 animate-pulse rounded bg-[#EBEBEB]" />
                      <div className="h-2.5 w-20 animate-pulse rounded bg-[#EBEBEB]" />
                    </div>
                    <div className="h-5 w-20 animate-pulse rounded-full bg-[#EBEBEB]" />
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-[#F7F7F7] p-3">
                    <div className="h-14 w-14 animate-pulse rounded-lg bg-[#EBEBEB] shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-4/5 animate-pulse rounded bg-[#EBEBEB]" />
                      <div className="h-2.5 w-1/3 animate-pulse rounded bg-[#EBEBEB]" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#E8E8E8] pt-3">
                    <div className="h-2.5 w-8 animate-pulse rounded bg-[#EBEBEB]" />
                    <div className="space-y-1 items-end flex flex-col">
                      <div className="h-3.5 w-20 animate-pulse rounded bg-[#EBEBEB]" />
                      <div className="h-2.5 w-12 animate-pulse rounded bg-[#EBEBEB]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column: Garage + Leaderboard */}
              <div className="flex flex-col gap-5">
                {/* Garage card */}
                <div className="rounded-[12px] bg-[#F3F3F3] px-5 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-3 w-24 animate-pulse rounded bg-[#DCDCDC]" />
                    <div className="h-8 w-28 animate-pulse rounded-full bg-[#DCDCDC]" />
                  </div>
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="rounded-xl bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex">
                        <div className="h-[90px] w-[90px] animate-pulse bg-[#F0F0F0] shrink-0" />
                        <div className="flex flex-1 flex-col justify-center px-4 py-3 gap-2">
                          <div className="h-3.5 w-3/5 animate-pulse rounded bg-[#EBEBEB]" />
                          <div className="h-2.5 w-2/5 animate-pulse rounded bg-[#EBEBEB]" />
                          <div className="h-5 w-28 animate-pulse rounded-full bg-[#EBEBEB]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leaderboard strip */}
                <div className="flex items-center justify-between rounded-[2px] bg-[#F3F3F3] px-6 py-6">
                  <div className="h-3 w-28 animate-pulse rounded bg-[#DCDCDC]" />
                  <div className="h-4 w-4 animate-pulse rounded bg-[#DCDCDC]" />
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </>
  )
}
