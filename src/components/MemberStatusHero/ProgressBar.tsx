interface ProgressBarProps {
  currentXp: number
  targetXp: number
}

export function ProgressBar({ currentXp, targetXp }: ProgressBarProps) {
  const progressPercent = Math.min((currentXp / targetXp) * 100, 100)
  const xpToGo = Math.max(targetXp - currentXp, 0)

  return (
    <div className="flex flex-col items-center w-full max-w-[380px]">
      {/* XP Number + Label */}
      <div className="flex items-start">
        <span
          className="text-[#F4F4F4] font-inter leading-[1.2]"
          style={{ fontSize: 110, fontWeight: 400 }}
        >
          {currentXp.toLocaleString()}
        </span>
        <span
          className="text-white font-inter mt-1"
          style={{ fontSize: 18, fontWeight: 400, lineHeight: '22px' }}
        >
          XP
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full mt-2">
        <div className="h-[5px] w-full bg-[#484848] rounded-[20px] overflow-hidden">
          <div
            className="h-full bg-white rounded-[20px] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Counters */}
      <div className="w-full flex items-center justify-between mt-2">
        <span className="text-white font-inter" style={{ fontSize: 16, fontWeight: 400, lineHeight: '20px' }}>
          {currentXp.toLocaleString()}/{targetXp.toLocaleString()}
        </span>
        <span className="text-[#484848] font-inter" style={{ fontSize: 16, fontWeight: 400, lineHeight: '20px' }}>
          {xpToGo.toLocaleString()} XP to go
        </span>
      </div>
    </div>
  )
}
