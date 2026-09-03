import { AlertTriangle, BarChart3, ClipboardCheck } from "lucide-react"
import type { ReactNode } from "react"

export interface ReportCardProps {
  children: ReactNode
  description: string
  emptyDescription?: string
  emptyTitle?: string
  error: Error | null
  eyebrow: string
  icon?: ReactNode
  isEmpty: boolean
  isError: boolean
  isPending: boolean
  onRetry: () => void
  title: string
}

export function ReportCard({
  children,
  description,
  emptyDescription = "El reporte aparecerá cuando existan registros disponibles.",
  emptyTitle = "No hay datos para mostrar",
  error,
  eyebrow,
  icon = <BarChart3 aria-hidden="true" className="h-4 w-4" />,
  isEmpty,
  isError,
  isPending,
  onRetry,
  title,
}: ReportCardProps) {
  const headingId = `report-${slugify(title)}-title`

  return (
    <section
      aria-labelledby={headingId}
      className="panel-shadow overflow-hidden rounded-[1.35rem] border border-line/80 bg-panel"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line/60 p-5 sm:p-6 sm:pb-5">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">
            {eyebrow}
          </p>
          <h2
            className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink"
            id={headingId}
          >
            {title}
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-ink-muted">{description}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
          {icon}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        {isPending ? <ReportSkeleton /> : null}
        {!isPending && isError ? (
          <div
            className="rounded-xl border border-rose/20 bg-rose-soft/60 px-4 py-4"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-rose-strong"
              />
              <div>
                <p className="text-xs font-semibold text-ink">
                  No pudimos cargar este reporte
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-muted">
                  {error?.message ?? "Intenta nuevamente en unos momentos."}
                </p>
                <button
                  className="mt-3 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none"
                  onClick={onRetry}
                  type="button"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {!isPending && !isError && isEmpty ? (
          <div className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-8 text-center">
            <ClipboardCheck
              aria-hidden="true"
              className="mx-auto h-5 w-5 text-ink-subtle"
            />
            <p className="mt-3 text-xs font-semibold text-ink">{emptyTitle}</p>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              {emptyDescription}
            </p>
          </div>
        ) : null}
        {!isPending && !isError && !isEmpty ? children : null}
      </div>
    </section>
  )
}

export function ReportMetric({
  detail,
  label,
  value,
}: {
  detail: string
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-line/70 bg-canvas/70 px-3.5 py-3">
      <p className="text-[0.66rem] font-medium text-ink-subtle">{label}</p>
      <p className="mt-1.5 font-display text-xl font-semibold tracking-[-0.04em] text-ink tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-[0.66rem] text-ink-muted">{detail}</p>
    </div>
  )
}

function ReportSkeleton() {
  return (
    <div aria-label="Cargando reporte" className="space-y-3" role="status">
      <div className="grid grid-cols-2 gap-3">
        <span className="h-16 animate-pulse rounded-xl bg-canvas" />
        <span className="h-16 animate-pulse rounded-xl bg-canvas" />
      </div>
      <span className="block h-44 animate-pulse rounded-xl bg-canvas" />
      <span className="block h-10 animate-pulse rounded-xl bg-canvas" />
    </div>
  )
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
