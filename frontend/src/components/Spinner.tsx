import { Loader2 } from 'lucide-react'

export function Spinner({ className = '', size = 24 }: { className?: string; size?: number }) {
  return <Loader2 className={`animate-spin text-brand-400 ${className}`} size={size} />
}

export function FullSpinner({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner size={32} />
      <p className="text-navy-400 text-sm">{message}</p>
    </div>
  )
}
