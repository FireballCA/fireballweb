interface ProgressBarProps {
  currentXp: number
  targetXp: number
}

export function ProgressBar({ currentXp, targetXp }: ProgressBarProps) {
  const progressPercent = Math.min((currentXp / targetXp) * 100, 100)
  const xpToGo = Math.max(targetXp - currentXp, 0)

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-start gap-2 mb-5">
        <span className="text-white text-[68px] font-bold leading-none">{currentXp.toLocaleString()}</span>
        <span className="text-white text-sm font-normal pt-1">XP</span>
      </div>

      <div className="w-full max-w-[320px] mb-3">
        <div className="h-1 w-full bg-[#c8c8c8]/35 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-[320px] flex items-center justify-between text-[13px]">
        <span className="text-white">
          {currentXp.toLocaleString()}/{targetXp.toLocaleString()}
        </span>
        <span className="text-[#c8c8c8]">{xpToGo.toLocaleString()} XP to go</span>
      </div>
    </div>
  )
}
