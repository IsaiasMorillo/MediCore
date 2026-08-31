import { AlertTriangle, ArrowUpRight, BarChart3, ClipboardCheck, PackageSearch } from "lucide-react"
import type { ReactNode } from "react"

import type { DashboardReports } from "@/features/dashboard/hooks/use-dashboard-reports"
import type {
  BillingReportRow,
  CategoryCountRow,
  MedicationDispensedRow,
} from "@/features/dashboard/types"

const numberFormatter = new Intl.NumberFormat("es-DO", {
  maximumFractionDigits: 0,
})
const decimalFormatter = new Intl.NumberFormat("es-DO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const monthFormatter = new Intl.DateTimeFormat("es-DO", { month: "short" })

const panelClassName = "panel-shadow rounded-[1.35rem] border border-line/80 bg-panel"

interface ReportCardProps {
  eyebrow: string
  title: string
  description: string
  isPending: boolean
  error: Error | null
  isEmpty: boolean
  onRetry: () => void
  children: ReactNode
}

function ReportCard({
  eyebrow,
  title,
  description,
  isPending,
  error,
  isEmpty,
  onRetry,
  children,
}: ReportCardProps) {
  return (
    <section aria-labelledby={`${title}-title`} className={`${panelClassName} overflow-hidden`}>
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6 sm:pb-5">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">
            {eyebrow}
          </p>
          <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id={`${title}-title`}>
            {title}
          </h2>
          <p className="mt-1 text-xs text-ink-muted">{description}</p>
        </div>
        <BarChart3 aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-brand-strong" />
      </div>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        {isPending ? <ReportSkeleton /> : null}
        {!isPending && error ? (
          <div className="rounded-xl border border-rose/20 bg-rose-soft/60 px-4 py-4" role="alert">
            <div className="flex items-start gap-3">
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-rose-strong" />
              <div>
                <p className="text-xs font-semibold text-ink">No pudimos cargar este reporte</p>
                <p className="mt-1 text-xs leading-5 text-ink-muted">{error.message}</p>
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
        {!isPending && !error && isEmpty ? <ReportEmptyState /> : null}
        {!isPending && !error && !isEmpty ? children : null}
      </div>
    </section>
  )
}

function ReportSkeleton() {
  return (
    <div aria-label="Cargando reporte" className="space-y-3" role="status">
      <div className="grid grid-cols-2 gap-3">
        <span className="h-16 animate-pulse rounded-xl bg-canvas" />
        <span className="h-16 animate-pulse rounded-xl bg-canvas" />
      </div>
      <span className="block h-10 animate-pulse rounded-xl bg-canvas" />
      <span className="block h-10 animate-pulse rounded-xl bg-canvas" />
    </div>
  )
}

function ReportEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-7 text-center">
      <ClipboardCheck aria-hidden="true" className="mx-auto h-5 w-5 text-ink-subtle" />
      <p className="mt-3 text-xs font-semibold text-ink">No hay datos para este período</p>
      <p className="mt-1 text-xs leading-5 text-ink-muted">El reporte aparecerá cuando existan registros disponibles.</p>
    </div>
  )
}

function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-line/70 bg-canvas/70 px-3.5 py-3">
      <p className="text-[0.66rem] font-medium text-ink-subtle">{label}</p>
      <p className="mt-1.5 font-display text-xl font-semibold tracking-[-0.04em] text-ink tabular-nums">{value}</p>
      <p className="mt-0.5 text-[0.66rem] text-ink-muted">{detail}</p>
    </div>
  )
}

function RankedList({
  rows,
  valueLabel,
}: {
  rows: readonly { label: string; value: number; detail?: string }[]
  valueLabel: string
}) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1)

  return (
    <ol aria-label={valueLabel} className="space-y-4">
      {rows.map((row, index) => (
        <li key={`${row.label}-${index}`}>
          <div className="flex items-baseline gap-3">
            <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-ink-subtle">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">{row.label}</span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">{numberFormatter.format(row.value)}</span>
          </div>
          <div aria-hidden="true" className="ml-7 mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
            <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(8, (row.value / maxValue) * 100)}%` }} />
          </div>
          {row.detail ? <p className="ml-7 mt-1 text-[0.66rem] text-ink-subtle">{row.detail}</p> : null}
        </li>
      ))}
    </ol>
  )
}

function BillingReport({ reports }: { reports: DashboardReports }) {
  const rows = reports.billing.data ?? []
  const totalInvoices = rows.reduce((sum, row) => sum + row.invoiceCount, 0)
  const totalInvoiced = rows.reduce((sum, row) => sum + row.totalInvoiced, 0)
  const latestMonth = rows[rows.length - 1]

  return (
    <ReportCard
      description="Facturas pagadas en el período actual"
      error={reports.billing.error as Error | null}
      eyebrow="Administración"
      isEmpty={rows.length === 0}
      isPending={reports.billing.isPending}
      onRetry={() => void reports.billing.refetch()}
      title="Facturación"
    >
      <div className="grid grid-cols-2 gap-3">
        <StatTile detail="Facturas pagadas" label="Cantidad" value={numberFormatter.format(totalInvoices)} />
        <StatTile detail="Suma reportada" label="Total" value={decimalFormatter.format(totalInvoiced)} />
      </div>
      <div className="mt-5 flex items-center justify-between border-b border-line/70 pb-2 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
        <span>Mes</span>
        <span>Facturas · total</span>
      </div>
      <ul className="divide-y divide-line/60">
        {rows.slice(-4).map((row) => (
          <li className="flex items-center justify-between gap-4 py-3 text-xs" key={`${row.year}-${row.month}`}>
            <span className="font-medium text-ink-muted">{formatMonth(row)}</span>
            <span className="text-right font-semibold tabular-nums text-ink">
              {numberFormatter.format(row.invoiceCount)} · {decimalFormatter.format(row.totalInvoiced)}
            </span>
          </li>
        ))}
      </ul>
      {latestMonth ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-brand-strong">
          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          Último mes reportado: {formatMonth(latestMonth)}
        </p>
      ) : null}
    </ReportCard>
  )
}

function FrequentPatientsReport({ reports }: { reports: DashboardReports }) {
  const rows = reports.patientsMostFrequent.data ?? []

  return (
    <ReportCard
      description="Pacientes con más citas no canceladas"
      error={reports.patientsMostFrequent.error as Error | null}
      eyebrow="Atención"
      isEmpty={rows.length === 0}
      isPending={reports.patientsMostFrequent.isPending}
      onRetry={() => void reports.patientsMostFrequent.refetch()}
      title="Pacientes frecuentes"
    >
      <RankedList
        rows={toRankedRows(rows)}
        valueLabel="Pacientes frecuentes por cantidad de citas"
      />
    </ReportCard>
  )
}

function DispensedReport({ reports }: { reports: DashboardReports }) {
  const rows = reports.medicationsDispensed.data ?? []

  return (
    <ReportCard
      description="Medicamentos agrupados por cantidad dispensada"
      error={reports.medicationsDispensed.error as Error | null}
      eyebrow="Farmacia"
      isEmpty={rows.length === 0}
      isPending={reports.medicationsDispensed.isPending}
      onRetry={() => void reports.medicationsDispensed.refetch()}
      title="Más dispensados"
    >
      <RankedList
        rows={rows.map(toDispensedRow)}
        valueLabel="Medicamentos más dispensados"
      />
    </ReportCard>
  )
}

function LowStockReport({ reports }: { reports: DashboardReports }) {
  const rows = reports.lowStock.data ?? []

  return (
    <ReportCard
      description="Medicamentos activos en o por debajo del nivel de reposición"
      error={reports.lowStock.error as Error | null}
      eyebrow="Inventario"
      isEmpty={rows.length === 0}
      isPending={reports.lowStock.isPending}
      onRetry={() => void reports.lowStock.refetch()}
      title="Stock bajo"
    >
      <ul className="divide-y divide-line/60">
        {rows.slice(0, 5).map((row) => (
          <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={row.medicationId}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-soft text-amber-strong">
              <PackageSearch aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-ink">{row.medicationName}</span>
              <span className="mt-0.5 block text-[0.66rem] text-ink-subtle">Nivel de reposición: {numberFormatter.format(row.reorderLevel)}</span>
            </span>
            <span className="shrink-0 rounded-md bg-amber-soft px-2 py-1 text-[0.66rem] font-semibold tabular-nums text-amber-strong">
              {numberFormatter.format(row.stockQuantity)} disponibles
            </span>
          </li>
        ))}
      </ul>
    </ReportCard>
  )
}

function LaboratoryReport({ reports }: { reports: DashboardReports }) {
  const rows = reports.laboratoryMostRequested.data ?? []

  return (
    <ReportCard
      description="Pruebas agrupadas por cantidad de órdenes"
      error={reports.laboratoryMostRequested.error as Error | null}
      eyebrow="Laboratorio"
      isEmpty={rows.length === 0}
      isPending={reports.laboratoryMostRequested.isPending}
      onRetry={() => void reports.laboratoryMostRequested.refetch()}
      title="Pruebas más solicitadas"
    >
      <RankedList
        rows={toRankedRows(rows)}
        valueLabel="Pruebas de laboratorio más solicitadas"
      />
    </ReportCard>
  )
}

export function DashboardReports({ reports }: { reports: DashboardReports }) {
  if (reports.isAdmin) {
    return (
      <section aria-label="Reportes de administración" className="mt-6 grid gap-6 xl:grid-cols-2">
        <BillingReport reports={reports} />
        <FrequentPatientsReport reports={reports} />
      </section>
    )
  }

  if (reports.isPharmacy) {
    return (
      <section aria-label="Reportes de farmacia" className="mt-6 grid gap-6 xl:grid-cols-2">
        <DispensedReport reports={reports} />
        <LowStockReport reports={reports} />
      </section>
    )
  }

  if (reports.isLaboratory) {
    return (
      <section aria-label="Reportes de laboratorio" className="mt-6 max-w-2xl">
        <LaboratoryReport reports={reports} />
      </section>
    )
  }

  return null
}

function toRankedRows(rows: readonly CategoryCountRow[]) {
  return rows.map((row) => ({ label: row.label, value: row.count }))
}

function toDispensedRow(row: MedicationDispensedRow) {
  return {
    label: row.medicationName,
    value: row.totalQuantity,
    detail: `${numberFormatter.format(row.prescriptionCount)} prescripciones dispensadas`,
  }
}

function formatMonth(row: BillingReportRow) {
  const month = monthFormatter.format(new Date(row.year, row.month - 1, 1))
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${row.year}`
}
