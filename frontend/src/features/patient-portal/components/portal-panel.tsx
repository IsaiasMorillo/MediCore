import { AlertTriangle, Inbox, RefreshCw } from "lucide-react"
import type { ReactNode } from "react"

interface PortalPanelProps {
  eyebrow?: string
  title: string
  description?: string
  icon: ReactNode
  action?: ReactNode
  isPending: boolean
  error: Error | null
  isEmpty: boolean
  emptyTitle: string
  emptyDescription: string
  onRetry: () => void
  children: ReactNode
}

export function PortalPanel({
  action,
  children,
  description,
  emptyDescription,
  emptyTitle,
  error,
  eyebrow,
  icon,
  isEmpty,
  isPending,
  onRetry,
  title,
}: PortalPanelProps) {
  return (
    <section aria-labelledby={`${title}-title`} className="panel-shadow overflow-hidden rounded-[1.45rem] border border-line/80 bg-panel">
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6 sm:pb-5">
        <div className="min-w-0">
          {eyebrow ? <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">{eyebrow}</p> : null}
          <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id={`${title}-title`}>{title}</h2>
          {description ? <p className="mt-1 max-w-xl text-xs leading-5 text-ink-muted">{description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-brand-strong">
          {action}
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft">{icon}</span>
        </div>
      </div>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        {isPending ? <PortalPanelSkeleton /> : null}
        {!isPending && error ? <PortalPanelError error={error} onRetry={onRetry} /> : null}
        {!isPending && !error && isEmpty ? <PortalPanelEmpty description={emptyDescription} title={emptyTitle} /> : null}
        {!isPending && !error && !isEmpty ? children : null}
      </div>
    </section>
  )
}

export function PortalPanelSkeleton() {
  return (
    <div aria-label="Cargando información" aria-live="polite" className="space-y-3" role="status">
      <div className="h-20 animate-pulse rounded-2xl bg-canvas" />
      <div className="h-12 animate-pulse rounded-2xl bg-canvas" />
      <div className="h-12 animate-pulse rounded-2xl bg-canvas" />
    </div>
  )
}

function PortalPanelError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose/20 bg-rose-soft/55 p-4" role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-rose-strong" />
        <div>
          <p className="text-xs font-semibold text-ink">No pudimos cargar esta información</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">{error.message || "Intenta nuevamente en unos segundos."}</p>
          <button className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand" onClick={onRetry} type="button">
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            Intentar nuevamente
          </button>
        </div>
      </div>
    </div>
  )
}

function PortalPanelEmpty({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas/45 px-5 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
        <Inbox aria-hidden="true" className="h-4 w-4" />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">{description}</p>
    </div>
  )
}
