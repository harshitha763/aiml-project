import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  danger = false,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmLabel?: string
  danger?: boolean
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3 items-start">
        {danger && (
          <div className="rounded-lg bg-red-500/15 p-2 shrink-0">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
        )}
        <p className="text-sm text-navy-300">{message}</p>
      </div>
    </Modal>
  )
}
