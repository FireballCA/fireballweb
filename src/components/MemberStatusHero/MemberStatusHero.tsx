import { UserIdentity } from './UserIdentity'
import { ProgressBar } from './ProgressBar'

interface MemberStatusHeroProps {
  userName?: string
  currentXp?: number
  targetXp?: number
  tier?: string
  benefits?: Array<{ text: string }>
}

export function MemberStatusHero({
  userName = 'Anthony Bergeron',
  currentXp = 2403,
  targetXp = 3000,
  tier = 'TIER 1',
  benefits = [
    { text: '5% off selected products' },
    { text: '10% off Car club subscription' },
    { text: 'Anniversary reward' },
  ],
}: MemberStatusHeroProps) {
  return (
    <section className="w-full bg-[#1D1D1D] pt-[180px] pb-[220px] px-6 md:px-12 lg:px-16">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-start">
          {/* Left: User Identity */}
          <div className="flex flex-col">
            <UserIdentity userName={userName} />
          </div>

          {/* Center: XP Progress */}
          <div className="flex flex-col items-center justify-center">
            <ProgressBar currentXp={currentXp} targetXp={targetXp} />
          </div>

          {/* Right: Tier Benefits */}
          <div className="flex flex-col items-end">
            <h2 className="text-white text-[11px] font-bold mb-6 uppercase tracking-wide">{tier} BENEFITS</h2>
            <div className="flex flex-col gap-2.5 items-end">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="bg-[#252525] text-white px-3.5 py-2.5 rounded-[6px] text-left text-xs flex items-center gap-2 w-[200px]"
                >
                  <span className="text-white text-sm select-none">+</span>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
