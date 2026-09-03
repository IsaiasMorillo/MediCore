import { ChevronLeft, ChevronRight, Circle, Inbox, RefreshCw, Search, X } from "lucide-react"
import { useId, type InputHTMLAttributes, type Key, type ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface DataTableColumn<TData> {
  key: string
  header: string
  render: (row: TData, index: number) => ReactNode
  className?: string
  headerClassName?: string
}

export function DataTable<TData>({
  caption,
  columns,
  emptyState,
  getRowKey,
  rowClassName,
  rows,
}: {
  caption: string
  columns: readonly DataTableColumn<TData>[]
  emptyState?: ReactNode
  getRowKey?: (row: TData, index: number) => Key
  rowClassName?: (row: TData, index: number) => string
  rows: readonly TData[]
}) {
  if (rows.length === 0 && emptyState) {
    return <div>{emptyState}</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line/80 text-[0.68rem] uppercase tracking-[0.12em] text-ink-subtle">
            {columns.map((column) => (
              <th className={cn("px-5 py-3 font-semibold", column.headerClassName)} key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {rows.map((row, index) => (
            <tr className={cn("transition-colors hover:bg-canvas/60", rowClassName?.(row, index))} key={getRowKey?.(row, index) ?? index}>
              {columns.map((column) => <td className={cn("px-5 py-4", column.className)} key={column.key}>{column.render(row, index)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SearchInput({
  className,
  id,
  label,
  onChange,
  onClear,
  placeholder = "Buscar",
  showLabel = false,
  value,
  ...inputProps
}: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "onChange" | "type" | "value"> & {
  id?: string
  label: string
  onChange: (value: string) => void
  onClear?: () => void
  showLabel?: boolean
  value: string
}) {
  const generatedId = useId()
  const inputId = id ?? `search-${generatedId}`

  return (
    <div className={cn("space-y-2", className)}>
      <label className={showLabel ? "block text-xs font-semibold text-ink" : "sr-only"} htmlFor={inputId}>{label}</label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        <input
          {...inputProps}
          aria-label={showLabel ? undefined : label}
          className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
          id={inputId}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={value}
        />
        {value ? (
          <button aria-label={`Limpiar ${label.toLocaleLowerCase("es")}`} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-canvas hover:text-ink" onClick={onClear ?? (() => onChange(""))} type="button">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function FilterBar({ ariaLabel, children, description, actions }: { ariaLabel: string; children: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <section aria-label={ariaLabel} className="rounded-[1.35rem] border border-line/80 bg-panel p-4 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">{children}</div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {description ? <div aria-live="polite" className="mt-3 text-[0.68rem] leading-5 text-ink-subtle">{description}</div> : null}
    </section>
  )
}

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger"

const statusToneClasses: Record<StatusTone, string> = {
  neutral: "border-line bg-canvas text-ink-muted",
  info: "border-indigo/25 bg-indigo-soft text-indigo",
  success: "border-brand/25 bg-brand-soft text-brand-strong",
  warning: "border-amber/30 bg-amber-soft text-amber-strong",
  danger: "border-rose/25 bg-rose-soft text-rose-strong",
}

export function StatusBadge({ className, icon, label, tone = "neutral" }: { className?: string; icon?: ReactNode; label: string; tone?: StatusTone }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold", statusToneClasses[tone], className)}>{icon}<span>{label}</span></span>
}

export function EmptyState({ action, className, description, icon = <Inbox aria-hidden="true" className="h-5 w-5" />, title }: { action?: ReactNode; className?: string; description: string; icon?: ReactNode; title: string }) {
  return (
    <div className={cn("flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center", className)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">{icon}</span>
      <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-md text-xs leading-5 text-ink-muted">{description}</p>
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2.5">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ description, onRetry, title = "No pudimos cargar la información" }: { description: string; onRetry?: () => void; title?: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center" role="alert">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-soft text-rose-strong">{<RefreshCw aria-hidden="true" className="h-5 w-5" />}</span>
      <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-md text-xs leading-5 text-ink-muted">{description}</p>
      {onRetry ? <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" onClick={onRetry} type="button"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Intentar nuevamente</button> : null}
    </div>
  )
}

export function SkeletonTable({ columns = 4, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Cargando tabla" className="overflow-hidden p-4 sm:p-5" role="status">
      <div className="space-y-3">
        <div className="grid gap-3 border-b border-line/70 pb-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, index) => <span className="h-3 animate-pulse rounded-full bg-line/60" key={index} />)}
        </div>
        {Array.from({ length: rows }, (_, row) => <div className="grid gap-3" key={row} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }, (_, column) => <span className="h-10 animate-pulse rounded-xl bg-canvas" key={column} />)}</div>)}
      </div>
    </div>
  )
}

export function PaginationPlaceholder({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange: (page: number) => void }) {
  if (pageCount <= 1) {
    return null
  }

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between border-t border-line/70 px-4 py-3 sm:px-5">
      <p className="text-xs text-ink-subtle">Página {page} de {pageCount}</p>
      <div className="flex items-center gap-2">
        <button aria-label="Página anterior" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel-raised text-ink-muted transition-colors hover:border-brand/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))} type="button"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
        <button aria-label="Página siguiente" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel-raised text-ink-muted transition-colors hover:border-brand/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40" disabled={page >= pageCount} onClick={() => onPageChange(Math.min(pageCount, page + 1))} type="button"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
      </div>
    </nav>
  )
}

export interface DetailListItem {
  label: string
  value: ReactNode
}

export function DetailList({ columns = 2, items }: { columns?: 1 | 2 | 3 | 4; items: readonly DetailListItem[] }) {
  return <dl className={cn("grid gap-x-6 gap-y-5", columns === 1 ? "grid-cols-1" : columns === 3 ? "sm:grid-cols-3" : columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2")}>{items.map((item) => <div key={item.label}><dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-subtle">{item.label}</dt><dd className="mt-1.5 break-words text-sm font-medium text-ink">{item.value}</dd></div>)}</dl>
}

export interface KeyValueItem {
  key: string
  label?: string
  value: ReactNode
}

export function KeyValueList({ entries }: { entries: readonly KeyValueItem[] }) {
  return <div className="divide-y divide-line/60 rounded-2xl border border-line/70 bg-canvas/40 px-4"><dl>{entries.map((entry) => <div className="grid gap-1 py-3 first:pt-4 last:pb-4 sm:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] sm:gap-5" key={entry.key}><dt className="text-xs font-semibold text-ink-muted">{entry.label ?? entry.key}</dt><dd className="break-words text-sm leading-6 text-ink">{entry.value}</dd></div>)}</dl></div>
}

export interface TimelineItem {
  id: string
  title: string
  date?: ReactNode
  description?: ReactNode
  meta?: ReactNode
  icon?: ReactNode
}

export function Timeline({ emptyState, items, limit }: { emptyState?: ReactNode; items: readonly TimelineItem[]; limit?: number }) {
  const visibleItems = typeof limit === "number" ? items.slice(0, limit) : items

  if (visibleItems.length === 0) {
    return <>{emptyState ?? <EmptyState description="Los eventos aparecerán aquí cuando estén disponibles." title="No hay eventos registrados" />}</>
  }

  return (
    <ol className="relative space-y-5 before:absolute before:bottom-5 before:left-[0.9rem] before:top-5 before:w-px before:bg-line/80 before:content-['']">
      {visibleItems.map((item) => (
        <li className="relative pl-9" key={item.id}>
          <span className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-panel bg-brand text-white shadow-sm">{item.icon ?? <Circle aria-hidden="true" className="h-2.5 w-2.5 fill-current" />}</span>
          <article className="rounded-2xl border border-line/80 bg-panel-raised p-4 sm:p-5">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
              {item.date ? <p className="shrink-0 text-[0.68rem] font-semibold text-brand-strong">{item.date}</p> : null}
            </div>
            {item.meta ? <div className="mt-2 text-xs text-ink-muted">{item.meta}</div> : null}
            {item.description ? <div className="mt-3 text-xs leading-5 text-ink-muted">{item.description}</div> : null}
          </article>
        </li>
      ))}
    </ol>
  )
}
