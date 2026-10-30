import { AudioLines, Lightbulb } from 'lucide-react'
import { cn } from '../utils/cn'

export function Logo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const iconSize = { sm: 18, md: 24, lg: 32 }[size]
  const textSize = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' }[size]
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative">
        <div
          className="flex items-center justify-center rounded-xl p-1.5 animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
        >
          <AudioLines size={iconSize} className="text-white" />
        </div>
        <Lightbulb size={iconSize * 0.5} className="absolute -top-1 -right-1 text-amber-400 fill-amber-400/30" />
      </div>
      {showText && (
        <div className={cn('font-bold tracking-tight', textSize)}>
          <span className="text-white">IntelliMeet</span>{' '}
          <span className="gradient-text">AI</span>
        </div>
      )}
    </div>
  )
}
