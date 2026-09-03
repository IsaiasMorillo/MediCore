import {
  ArrowUpRight,
  FlaskConical,
  PackageSearch,
  ReceiptText,
  TriangleAlert,
  UsersRound,
} from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { Area } from "@/components/charts/area"
import { AreaChart } from "@/components/charts/area-chart"
import { Bar } from "@/components/charts/bar"
import { BarChart } from "@/components/charts/bar-chart"
import { BarYAxis } from "@/components/charts/bar-y-axis"
import { Grid } from "@/components/charts/grid"
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip"
import { XAxis } from "@/components/charts/x-axis"
import type { ReportsQueryState } from "@/features/reports/hooks/use-reports"
import type {
  CategoryCountRow,
  LowStockRow,
  MedicationDispensedRow,
} from "@/features/reports/types"
import {
  formatReportMonth,
  sortBillingRowsAscending,
  sortBillingRowsDescending,
  sortLowStockRows,
  stockDifference,
  toBillingChartData,
} from "@/features/reports/utils/report-formatting"
import { formatBillingCurrency } from "@/features/billing/utils/billing-formatting"
import { ReportCard, ReportMetric } from "@/features/reports/components/report-card"

const numberFormatter = new Intl.NumberFormat("es-DO", {
  maximumFractionDigits: 0,
})

const panelTableClassName =
  "mt-6 overflow-x-auto rounded-xl border border-line/70"

type BillingQuery = ReportsQueryState["billing"]
type CategoryQuery = ReportsQueryState["patientsMostFrequent"]
type DispensedQuery = ReportsQueryState["medicationsDispensed"]
type LowStockQuery = ReportsQueryState["lowStock"]
type LaboratoryQuery = ReportsQueryState["laboratoryMostRequested"]

export function BillingReportPanel({ query }: { query: BillingQuery }) {
  const rows = query.data ?? []
  const chronologicalRows = sortBillingRowsAscending(rows)
  const chartData = toBillingChartData(rows).map((row) => ({
    ...row,
    monthLabel: formatReportMonth(row.date.getUTCFullYear(), row.date.getUTCMonth() + 1),
  }))
  const totalInvoices = rows.reduce((sum, row) => sum + row.invoiceCount, 0)
  const totalInvoiced = rows.reduce((sum, row) => sum + row.totalInvoiced, 0)
  const latestMonth = chronologicalRows.at(-1)

  return (
    <ReportCard
      description="Facturas con estado Pagada agrupadas por mes de factura."
      emptyDescription="No hay facturas pagadas dentro del período seleccionado."
      emptyTitle="No hay facturas pagadas"
      error={query.error}
      eyebrow="Administración"
      icon={<ReceiptText aria-hidden="true" className="h-4 w-4" />}
      isEmpty={rows.length === 0}
      isError={query.isError}
      isPending={query.isPending}
      onRetry={() => void query.refetch()}
      title="Facturación"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ReportMetric
          detail="Facturas con estado Pagada"
          label="Cantidad"
          value={numberFormatter.format(totalInvoices)}
        />
        <ReportMetric
          detail="Suma reportada por la API"
          label="Total pagado"
          value={formatBillingCurrency(totalInvoiced)}
        />
      </div>

      <figure aria-labelledby="billing-trend-caption" className="mt-6">
        <figcaption
          className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
          id="billing-trend-caption"
        >
          <span className="text-sm font-semibold text-ink">Tendencia mensual</span>
          <span className="text-xs text-ink-subtle">Monto pagado por mes</span>
        </figcaption>
        <div aria-hidden="true" className="mt-3">
          <AreaChart
            aspectRatio="2.35 / 1"
            data={chartData}
            margin={{ bottom: 40, left: 18, right: 18, top: 22 }}
          >
            <Grid hideHorizontalEdgeLines horizontal numTicksRows={4} />
            <Area
              dataKey="totalInvoiced"
              fill="var(--chart-line-primary)"
              fillOpacity={0.28}
              showMarkers={chartData.length <= 12}
              stroke="var(--chart-line-primary)"
              strokeWidth={2.5}
            />
            <XAxis numTicks={Math.max(2, Math.min(6, chartData.length))} />
            <ChartTooltip
              rows={(point) => [
                {
                  color: "var(--chart-line-secondary)",
                  label: "Período",
                  value: String(point.monthLabel ?? "No disponible"),
                },
                {
                  color: "var(--chart-line-primary)",
                  label: "Total pagado",
                  value: formatBillingCurrency(numberValue(point.totalInvoiced)),
                },
                {
                  color: "var(--chart-line-secondary)",
                  label: "Facturas pagadas",
                  value: numberFormatter.format(numberValue(point.invoiceCount)),
                },
              ]}
            />
          </AreaChart>
        </div>
      </figure>

      <div className={panelTableClassName}>
        <table className="min-w-[32rem] w-full text-left text-xs">
          <caption className="sr-only">Detalle mensual de facturas pagadas</caption>
          <thead className="bg-canvas/70 text-[0.66rem] uppercase tracking-[0.12em] text-ink-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold" scope="col">Mes</th>
              <th className="px-4 py-3 text-right font-semibold" scope="col">Facturas pagadas</th>
              <th className="px-4 py-3 text-right font-semibold" scope="col">Total pagado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {sortBillingRowsDescending(rows).map((row) => (
              <tr className="text-ink" key={`${row.year}-${row.month}`}>
                <th className="px-4 py-3 font-medium text-ink-muted" scope="row">
                  {formatReportMonth(row.year, row.month)}
                </th>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {numberFormatter.format(row.invoiceCount)}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {formatBillingCurrency(row.totalInvoiced)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {latestMonth ? (
        <p className="mt-4 inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-brand-strong">
          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          Último mes con datos: {formatReportMonth(latestMonth.year, latestMonth.month)}
        </p>
      ) : null}

      <p className="mt-4 border-t border-line/60 pt-4 text-[0.68rem] leading-5 text-ink-subtle">
        Este indicador representa facturas pagadas, no el total de facturas emitidas ni los saldos pendientes.
      </p>
    </ReportCard>
  )
}

export function FrequentPatientsPanel({ query }: { query: CategoryQuery }) {
  const rows = query.data ?? []
  const totalAppointments = rows.reduce((sum, row) => sum + row.count, 0)
  const topPatient = rows[0]

  return (
    <ReportCard
      description="Pacientes con más citas que no fueron canceladas."
      emptyDescription="El ranking aparecerá cuando existan citas no canceladas."
      error={query.error}
      eyebrow="Atención"
      icon={<UsersRound aria-hidden="true" className="h-4 w-4" />}
      isEmpty={rows.length === 0}
      isError={query.isError}
      isPending={query.isPending}
      onRetry={() => void query.refetch()}
      title="Pacientes frecuentes"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ReportMetric
          detail="Suma de citas del ranking"
          label="Citas consideradas"
          value={numberFormatter.format(totalAppointments)}
        />
        <ReportMetric
          detail={topPatient ? `${numberFormatter.format(topPatient.count)} citas` : "Sin datos"}
          label="Mayor frecuencia"
          value={topPatient?.label ?? "Sin datos"}
        />
      </div>
      <RankingChart
        rows={rows.map(toCategoryRankingRow)}
        valueLabel="Citas no canceladas"
        valueFormatter={(value) => numberFormatter.format(value)}
      />
      <CategoryCountTable caption="Detalle de pacientes frecuentes" rows={rows} valueLabel="Citas" />
      <p className="mt-4 text-[0.68rem] leading-5 text-ink-subtle">
        El backend cuenta citas programadas, confirmadas, reprogramadas y completadas; no aplica un filtro de fechas.
      </p>
    </ReportCard>
  )
}

export function DispensedMedicationsPanel({ query }: { query: DispensedQuery }) {
  const rows = query.data ?? []
  const totalQuantity = rows.reduce((sum, row) => sum + row.totalQuantity, 0)
  const totalPrescriptions = rows.reduce((sum, row) => sum + row.prescriptionCount, 0)

  return (
    <ReportCard
      description="Medicamentos de recetas con estado Despachada, ordenados por unidades."
      emptyDescription="El ranking aparecerá cuando farmacia haya dispensado recetas."
      error={query.error}
      eyebrow="Farmacia"
      icon={<PackageSearch aria-hidden="true" className="h-4 w-4" />}
      isEmpty={rows.length === 0}
      isError={query.isError}
      isPending={query.isPending}
      onRetry={() => void query.refetch()}
      title="Medicamentos más dispensados"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ReportMetric
          detail="Unidades de las recetas del ranking"
          label="Unidades dispensadas"
          value={numberFormatter.format(totalQuantity)}
        />
        <ReportMetric
          detail="Recetas con estado Despachada"
          label="Recetas dispensadas"
          value={numberFormatter.format(totalPrescriptions)}
        />
      </div>
      <RankingChart
        rows={rows.map(toDispensedRankingRow)}
        valueLabel="Unidades dispensadas"
        valueFormatter={(value) => numberFormatter.format(value)}
      />
      <div className={panelTableClassName}>
        <table className="min-w-[34rem] w-full text-left text-xs">
          <caption className="sr-only">Detalle de medicamentos más dispensados</caption>
          <thead className="bg-canvas/70 text-[0.66rem] uppercase tracking-[0.12em] text-ink-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold" scope="col">Medicamento</th>
              <th className="px-4 py-3 text-right font-semibold" scope="col">Recetas</th>
              <th className="px-4 py-3 text-right font-semibold" scope="col">Unidades</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {rows.map((row) => (
              <tr className="text-ink" key={row.medicationId}>
                <th className="px-4 py-3 font-medium text-ink-muted" scope="row">{row.medicationName}</th>
                <td className="px-4 py-3 text-right tabular-nums">{numberFormatter.format(row.prescriptionCount)}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{numberFormatter.format(row.totalQuantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportCard>
  )
}

export function LowStockPanel({ query }: { query: LowStockQuery }) {
  const rows = sortLowStockRows(query.data ?? [])
  const totalUnits = rows.reduce((sum, row) => sum + row.stockQuantity, 0)
  const belowReorderLevel = rows.filter((row) => row.stockQuantity < row.reorderLevel).length

  return (
    <ReportCard
      description="Medicamentos activos con stock menor o igual al nivel de reposición."
      emptyDescription="No hay medicamentos activos en o por debajo del nivel de reposición."
      emptyTitle="Inventario sin alertas de reposición"
      error={query.error}
      eyebrow="Inventario"
      icon={<TriangleAlert aria-hidden="true" className="h-4 w-4" />}
      isEmpty={rows.length === 0}
      isError={query.isError}
      isPending={query.isPending}
      onRetry={() => void query.refetch()}
      title="Stock bajo"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ReportMetric
          detail="Referencias devueltas por la API"
          label="Medicamentos"
          value={numberFormatter.format(rows.length)}
        />
        <ReportMetric
          detail={`${numberFormatter.format(belowReorderLevel)} por debajo del nivel`}
          label="Unidades disponibles"
          value={numberFormatter.format(totalUnits)}
        />
      </div>

      <div className={panelTableClassName}>
        <table className="min-w-[42rem] w-full text-left text-xs">
          <caption className="sr-only">Medicamentos con stock bajo</caption>
          <thead className="bg-canvas/70 text-[0.66rem] uppercase tracking-[0.12em] text-ink-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold" scope="col">Medicamento</th>
              <th className="px-4 py-3 text-right font-semibold" scope="col">Disponible</th>
              <th className="px-4 py-3 text-right font-semibold" scope="col">Reposición</th>
              <th className="px-4 py-3 text-right font-semibold" scope="col">Diferencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {rows.map((row) => <LowStockTableRow key={row.medicationId} row={row} />)}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.68rem] leading-5 text-ink-subtle">
          La lista se ordena por diferencia contra el nivel de reposición para facilitar la revisión.
        </p>
        <Link
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong transition-colors hover:text-brand focus-visible:outline-none"
          to="/app/pharmacy/medications"
        >
          Abrir inventario
          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </ReportCard>
  )
}

function LowStockTableRow({ row }: { row: LowStockRow }) {
  const difference = stockDifference(row)
  const ratio = row.reorderLevel > 0
    ? Math.min(100, (row.stockQuantity / row.reorderLevel) * 100)
    : row.stockQuantity === 0 ? 0 : 100

  return (
    <tr className="text-ink">
      <th className="px-4 py-3 font-medium text-ink-muted" scope="row">
        <Link
          className="block min-w-[10rem] transition-colors hover:text-brand-strong focus-visible:outline-none"
          to={`/app/pharmacy/medications/${encodeURIComponent(row.medicationId)}/edit`}
        >
          {row.medicationName}
        </Link>
        <span
          aria-hidden="true"
          className="mt-2 block h-1.5 w-28 overflow-hidden rounded-full bg-amber-soft"
        >
          <span className="block h-full rounded-full bg-amber" style={{ width: `${ratio}%` }} />
        </span>
      </th>
      <td className="px-4 py-3 text-right font-semibold tabular-nums">{numberFormatter.format(row.stockQuantity)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{numberFormatter.format(row.reorderLevel)}</td>
      <td className="px-4 py-3 text-right font-semibold tabular-nums text-amber-strong">
        {formatSignedNumber(difference)}
      </td>
    </tr>
  )
}

export function LaboratoryTestsPanel({ query }: { query: LaboratoryQuery }) {
  const rows = query.data ?? []
  const totalOrders = rows.reduce((sum, row) => sum + row.count, 0)
  const topTest = rows[0]

  return (
    <ReportCard
      description="Tipos de prueba agrupados por cantidad de órdenes registradas."
      emptyDescription="El ranking aparecerá cuando existan órdenes de laboratorio."
      error={query.error}
      eyebrow="Laboratorio"
      icon={<FlaskConical aria-hidden="true" className="h-4 w-4" />}
      isEmpty={rows.length === 0}
      isError={query.isError}
      isPending={query.isPending}
      onRetry={() => void query.refetch()}
      title="Pruebas más solicitadas"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ReportMetric
          detail="Suma de órdenes del ranking"
          label="Órdenes consideradas"
          value={numberFormatter.format(totalOrders)}
        />
        <ReportMetric
          detail={topTest ? `${numberFormatter.format(topTest.count)} órdenes` : "Sin datos"}
          label="Prueba principal"
          value={topTest?.label ?? "Sin datos"}
        />
      </div>
      <RankingChart
        rows={rows.map(toCategoryRankingRow)}
        valueLabel="Órdenes de laboratorio"
        valueFormatter={(value) => numberFormatter.format(value)}
      />
      <CategoryCountTable caption="Detalle de pruebas más solicitadas" rows={rows} valueLabel="Órdenes" />
      <p className="mt-4 text-[0.68rem] leading-5 text-ink-subtle">
        Este reporte es acumulado: la API actual no expone filtros por fecha ni por estado de la orden.
      </p>
    </ReportCard>
  )
}

function RankingChart({
  rows,
  valueFormatter,
  valueLabel,
}: {
  rows: readonly RankingRow[]
  valueFormatter: (value: number) => string
  valueLabel: string
}) {
  const chartData: Record<string, unknown>[] = rows.map((row) => ({
    name: row.label,
    value: row.value,
  }))

  return (
    <figure aria-label={`Gráfico de ${valueLabel.toLocaleLowerCase("es")}`} className="mt-6">
      <div aria-hidden="true">
        <BarChart
          aspectRatio="1.9 / 1"
          data={chartData}
          margin={{ bottom: 18, left: 112, right: 22, top: 18 }}
          orientation="horizontal"
        >
          <Grid horizontal={false} vertical />
          <Bar dataKey="value" fill="var(--chart-line-primary)" lineCap="round" minBarHeight={8} />
          <BarYAxis maxLabels={10} />
          <ChartTooltip
            rows={(point) => [
              {
                color: "var(--chart-line-primary)",
                label: valueLabel,
                value: valueFormatter(numberValue(point.value)),
              },
            ]}
            showDatePill={false}
          />
        </BarChart>
      </div>
    </figure>
  )
}

function CategoryCountTable({
  caption,
  rows,
  valueLabel,
}: {
  caption: string
  rows: readonly CategoryCountRow[]
  valueLabel: string
}) {
  return (
    <div className={panelTableClassName}>
      <table className="min-w-[26rem] w-full text-left text-xs">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-canvas/70 text-[0.66rem] uppercase tracking-[0.12em] text-ink-subtle">
          <tr>
            <th className="px-4 py-3 font-semibold" scope="col">Nombre</th>
            <th className="px-4 py-3 text-right font-semibold" scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {rows.map((row) => (
            <tr className="text-ink" key={row.key}>
              <th className="px-4 py-3 font-medium text-ink-muted" scope="row">{row.label}</th>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">{numberFormatter.format(row.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface RankingRow {
  label: string
  value: number
}

function toCategoryRankingRow(row: CategoryCountRow): RankingRow {
  return { label: row.label, value: row.count }
}

function toDispensedRankingRow(row: MedicationDispensedRow): RankingRow {
  return { label: row.medicationName, value: row.totalQuantity }
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function formatSignedNumber(value: number) {
  if (value > 0) {
    return `+${numberFormatter.format(value)}`
  }

  return numberFormatter.format(value)
}

export function ReportSectionGrid({ children }: { children: ReactNode }) {
  return <div className="mt-6 grid gap-6 xl:grid-cols-2">{children}</div>
}
