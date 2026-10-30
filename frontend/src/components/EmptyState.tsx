import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-2xl bg-navy-800/50 p-4 mb-4">
        <Icon size={32} className="text-navy-500" />
      </div>
      <h3 className="text-lg font-semibold text-navy-200 mb-1">{title}</h3>
      <p className="text-sm text-navy-400 max-w-md mb-4">{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
