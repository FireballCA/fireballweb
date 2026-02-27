interface BadgeProps {
  imageSrc?: string
  alt?: string
}

export function Badge({ 
  imageSrc = '/Account/Level Badge/Carbone.png', 
  alt = 'Level badge' 
}: BadgeProps) {
  return (
    <div className="flex items-center justify-center">
      <img 
        src={imageSrc} 
        alt={alt}
        className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] object-contain"
        draggable={false}
      />
    </div>
  )
}
