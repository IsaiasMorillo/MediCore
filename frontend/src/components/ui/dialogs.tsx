import { AlertTriangle, X } from "lucide-react"
import { createPortal } from "react-dom"
import { useEffect, useId, useRef, type ReactNode } from "react"

const FOCUSABLE_SELECTOR = "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"

interface BaseDialogProps {
  children?: ReactNode
  description: string
  onClose: () => void
  open: boolean
  title: string
  destructive?: boolean
  actions: ReactNode
}

function BaseDialog({ actions, children, description, destructive = false, onClose, open, title }: BaseDialogProps) {
  const dialogRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const dialog = dialogRef.current
    const previousFocus = document.activeElement as HTMLElement | null

    if (!dialog) {
      return
    }

    const getFocusableElements = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    getFocusableElements()[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const focusableElements = getFocusableElements()
      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]

      if (!first || !last) {
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button aria-label="Cerrar diálogo" className="absolute inset-0 bg-ink/35 backdrop-blur-sm" onClick={onClose} type="button" />
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={destructive ? "relative w-full max-w-lg rounded-[1.35rem] border border-rose/25 bg-panel p-5 shadow-2xl sm:p-6" : "relative w-full max-w-lg rounded-[1.35rem] border border-line/80 bg-panel p-5 shadow-2xl sm:p-6"}
        ref={dialogRef}
        role={destructive ? "alertdialog" : "dialog"}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {destructive ? <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-soft text-rose-strong"><AlertTriangle aria-hidden="true" className="h-4 w-4" /></span> : null}
            <div>
              <h2 className="font-display text-lg font-semibold tracking-[-0.035em] text-ink" id={titleId}>{title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted" id={descriptionId}>{description}</p>
            </div>
          </div>
          <button aria-label="Cerrar diálogo" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-canvas hover:text-ink" onClick={onClose} type="button"><X aria-hidden="true" className="h-4 w-4" /></button>
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
      </section>
    </div>,
    document.body
  )
}

interface ConfirmActionDialogProps {
  open: boolean
  title: string
  description: string
  onClose: () => void
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  isPending?: boolean
  children?: ReactNode
}

export function ConfirmActionDialog({ cancelLabel = "Cancelar", children, confirmLabel = "Confirmar", description, isPending = false, onClose, onConfirm, open, title }: ConfirmActionDialogProps) {
  return (
    <BaseDialog actions={<><button className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" disabled={isPending} onClick={onClose} type="button">{cancelLabel}</button><button className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong disabled:cursor-wait disabled:opacity-60" disabled={isPending} onClick={onConfirm} type="button">{isPending ? "Procesando..." : confirmLabel}</button></>} description={description} onClose={onClose} open={open} title={title}>{children}</BaseDialog>
  )
}

export function DestructiveActionDialog({ cancelLabel = "Cancelar", children, confirmLabel = "Sí, continuar", description, isPending = false, onClose, onConfirm, open, title }: ConfirmActionDialogProps) {
  return (
    <BaseDialog actions={<><button className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" disabled={isPending} onClick={onClose} type="button">{cancelLabel}</button><button className="rounded-xl bg-rose-strong px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose disabled:cursor-wait disabled:opacity-60" disabled={isPending} onClick={onConfirm} type="button">{isPending ? "Procesando..." : confirmLabel}</button></>} destructive description={description} onClose={onClose} open={open} title={title}>{children}</BaseDialog>
  )
}
