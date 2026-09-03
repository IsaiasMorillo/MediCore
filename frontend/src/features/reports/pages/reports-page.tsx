import { BarChart3, Check, RefreshCw, SlidersHorizontal } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useState, type FormEvent } from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import {
  hasAnyRole,
  type UserRole,
} from "@/lib/permissions/roles"
import {
  REPORT_BILLING_ROLES,
  REPORT_LABORATORY_ROLES,
  REPORT_PHARMACY_ROLES,
  REPORT_ROLES,
} from "@/lib/permissions/route-roles"
import {
  BillingReportPanel,
  DispensedMedicationsPanel,
  FrequentPatientsPanel,
  LaboratoryTestsPanel,
  LowStockPanel,
  ReportSectionGrid,
} from "@/features/reports/components/report-panels"
import { useReports } from "@/features/reports/hooks/use-reports"
import type { ReportSection } from "@/features/reports/types"
import {
  formatReportDate,
  getCurrentMonthRange,
  isBillingRangeValid,
  isDateInputValue,
} from "@/features/reports/utils/report-formatting"

const reportTabs: readonly ReportTab[] = [
  {
    label: "Resumen",
    path: "/app/reports",
    roles: REPORT_ROLES,
    section: "overview",
  },
  {
    label: "Facturación",
    path: "/app/reports/billing",
    roles: REPORT_BILLING_ROLES,
    section: "billing",
  },
  {
    label: "Farmacia",
    path: "/app/reports/pharmacy",
    roles: REPORT_PHARMACY_ROLES,
    section: "pharmacy",
  },
  {
    label: "Laboratorio",
    path: "/app/reports/laboratory",
    roles: REPORT_LABORATORY_ROLES,
    section: "laboratory",
  },
]

const pageCopy: Record<ReportSection, { description: string; eyebrow: string; title: string }> = {
  overview: {
    description: "Indicadores agregados respaldados por la API y filtrados según tu rol operativo.",
    eyebrow: "MediCore · Inteligencia operativa",
    title: "Reportes",
  },
  billing: {
    description: "Revisa el comportamiento mensual de las facturas pagadas y el detalle que lo sustenta.",
    eyebrow: "Reportes · Administración",
    title: "Reporte de facturación",
  },
  pharmacy: {
    description: "Identifica los medicamentos más dispensados y las referencias que requieren reposición.",
    eyebrow: "Reportes · Farmacia",
    title: "Reportes de farmacia",
  },
  laboratory: {
    description: "Consulta la distribución acumulada de las pruebas solicitadas en el hospital.",
    eyebrow: "Reportes · Laboratorio",
    title: "Reportes de laboratorio",
  },
}

interface ReportTab {
  label: string
  path: string
  roles: readonly UserRole[]
  section: ReportSection
}

export function ReportsPage({ section }: { section: ReportSection }) {
  const { session } = useAuthSession()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const shouldReduceMotion = useReducedMotion()
  const defaultRange = getCurrentMonthRange()
  const from = resolveDateParam(searchParams.get("from"), defaultRange.from)
  const to = resolveDateParam(searchParams.get("to"), defaultRange.to)
  const [filterError, setFilterError] = useState<string | null>(null)
  const [filterRevision, setFilterRevision] = useState(0)
  const reports = useReports(section, {
    from,
    to,
  })

  if (!session) {
    return null
  }

  const copy = pageCopy[section]
  const visibleTabs = reportTabs.filter((tab) => hasAnyRole(session.user.roles, tab.roles))
  const showBillingFilters = reports.isAdmin && (section === "overview" || section === "billing")
  const lastUpdatedLabel = reports.lastUpdatedAt
    ? `Actualizado ${formatTime(reports.lastUpdatedAt)}`
    : "Datos bajo demanda"

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextFrom = String(formData.get("from") ?? "")
    const nextTo = String(formData.get("to") ?? "")

    if (!isBillingRangeValid(nextFrom, nextTo)) {
      setFilterError("Selecciona fechas válidas y asegúrate de que el inicio no sea posterior al final.")
      return
    }

    setFilterError(null)
    setSearchParams({ from: nextFrom, to: nextTo })
  }

  const handleResetFilters = () => {
    const currentRange = getCurrentMonthRange()
    setFilterError(null)
    setFilterRevision((revision) => revision + 1)
    setSearchParams({ from: currentRange.from, to: currentRange.to })
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <PageHeader
        actions={
          <>
            <span aria-live="polite" className="hidden text-[0.68rem] text-ink-subtle sm:inline">
              {reports.isFetching ? "Actualizando reportes..." : lastUpdatedLabel}
            </span>
            <button
              aria-label="Actualizar reportes"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel text-ink-muted shadow-sm transition-colors hover:border-brand/40 hover:text-ink disabled:cursor-wait disabled:opacity-60"
              disabled={reports.isFetching}
              onClick={() => void reports.refresh()}
              title="Actualizar reportes"
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={reports.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              />
            </button>
          </>
        }
        description={copy.description}
        eyebrow={copy.eyebrow}
        title={copy.title}
      />

      <ReportTabs currentPath={location.pathname} tabs={visibleTabs} />

      {showBillingFilters ? (
        <BillingFilters
          error={filterError}
          from={from}
          onClearError={() => setFilterError(null)}
          onReset={handleResetFilters}
          onSubmit={handleFilterSubmit}
          revision={filterRevision}
          to={to}
        />
      ) : null}

      <ReportContext section={section} />
      <ReportContent reports={reports} section={section} />

      <footer className="mt-7 flex flex-col gap-2 border-t border-line/70 pt-4 text-[0.68rem] text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
        <span>Los reportes muestran únicamente datos entregados por la API.</span>
        <span>{lastUpdatedLabel}</span>
      </footer>
    </motion.div>
  )
}

function ReportTabs({ currentPath, tabs }: { currentPath: string; tabs: readonly ReportTab[] }) {
  return (
    <nav
      aria-label="Secciones de reportes"
      className="mt-6 flex gap-2 overflow-x-auto border-b border-line/70 pb-px"
    >
      {tabs.map((tab) => {
        const isActive = currentPath === tab.path

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "relative inline-flex shrink-0 items-center gap-2 border-b-2 border-brand px-3 py-3 text-xs font-semibold text-brand-strong"
                : "inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-3 text-xs font-medium text-ink-muted transition-colors hover:border-line hover:text-ink"
            }
            key={tab.section}
            to={tab.path}
          >
            {tab.label}
            {isActive ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : null}
          </Link>
        )
      })}
    </nav>
  )
}

function BillingFilters({
  error,
  from,
  onClearError,
  onReset,
  onSubmit,
  revision,
  to,
}: {
  error: string | null
  from: string
  onClearError: () => void
  onReset: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  revision: number
  to: string
}) {
  return (
    <section
      aria-labelledby="billing-filters-title"
      className="mt-6 rounded-[1.35rem] border border-line/80 bg-panel p-4 shadow-[0_20px_55px_-38px_var(--ink)] sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">
            <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
            Período del reporte
          </div>
          <h2
            className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink"
            id="billing-filters-title"
          >
            Filtra las facturas pagadas
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-ink-muted">
            El límite final se interpreta como el último día incluido. La API agrupa por fecha de factura.
          </p>
        </div>
        <form
          className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-[38rem]"
          key={`${from}-${to}-${revision}`}
          onChange={onClearError}
          onSubmit={onSubmit}
        >
          <label>
            <span className="mb-2 block text-xs font-semibold text-ink">Desde</span>
            <input
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "billing-filter-error" : undefined}
              className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
              name="from"
              type="date"
              defaultValue={from}
            />
          </label>
          <label>
            <span className="mb-2 block text-xs font-semibold text-ink">Hasta</span>
            <input
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "billing-filter-error" : undefined}
              className="h-11 w-full rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
              name="to"
              type="date"
              defaultValue={to}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 sm:justify-end">
            <button
              className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-panel-raised px-3.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
              onClick={onReset}
              type="button"
            >
              Este mes
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-xs font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong"
              type="submit"
            >
              <BarChart3 aria-hidden="true" className="h-3.5 w-3.5" />
              Aplicar período
            </button>
          </div>
        </form>
      </div>
      {error ? <p className="mt-3 text-xs font-medium text-rose-strong" id="billing-filter-error" role="alert">{error}</p> : null}
      <p className="mt-3 text-[0.68rem] text-ink-subtle">
        {formatReportDate(from)} · {formatReportDate(to)}
      </p>
    </section>
  )
}

function ReportContext({ section }: { section: ReportSection }) {
  const context = {
    overview: "Vista general: solo se solicitan los indicadores que tu sesión puede consultar.",
    billing: "Lectura financiera: el total se limita a facturas con estado Pagada.",
    pharmacy: "Operación de inventario: stock bajo significa stock menor o igual al nivel de reposición.",
    laboratory: "Lectura acumulada: el endpoint actual no ofrece filtros por fecha ni por estado.",
  }[section]

  return (
    <section aria-label="Contexto del reporte" className="mt-6 flex items-start gap-3 rounded-2xl border border-brand/15 bg-brand-soft/45 px-4 py-3.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-panel text-brand-strong shadow-sm">
        <BarChart3 aria-hidden="true" className="h-4 w-4" />
      </span>
      <p className="text-xs leading-5 text-ink-muted">{context}</p>
    </section>
  )
}

function ReportContent({ reports, section }: { reports: ReturnType<typeof useReports>; section: ReportSection }) {
  if (section === "billing") {
    return (
      <ReportSectionGrid>
        <BillingReportPanel query={reports.billing} />
        <FrequentPatientsPanel query={reports.patientsMostFrequent} />
      </ReportSectionGrid>
    )
  }

  if (section === "pharmacy") {
    return (
      <ReportSectionGrid>
        <DispensedMedicationsPanel query={reports.medicationsDispensed} />
        <LowStockPanel query={reports.lowStock} />
      </ReportSectionGrid>
    )
  }

  if (section === "laboratory") {
    return (
      <div className="mt-6 max-w-4xl">
        <LaboratoryTestsPanel query={reports.laboratoryMostRequested} />
      </div>
    )
  }

  return (
    <ReportSectionGrid>
      {reports.isAdmin ? <BillingReportPanel query={reports.billing} /> : null}
      {reports.isAdmin ? <FrequentPatientsPanel query={reports.patientsMostFrequent} /> : null}
      {reports.canViewPharmacyReports ? <DispensedMedicationsPanel query={reports.medicationsDispensed} /> : null}
      {reports.canViewPharmacyReports ? <LowStockPanel query={reports.lowStock} /> : null}
      {reports.canViewLaboratoryReports ? <LaboratoryTestsPanel query={reports.laboratoryMostRequested} /> : null}
    </ReportSectionGrid>
  )
}

function resolveDateParam(value: string | null, fallback: string) {
  return value && isDateInputValue(value) ? value : fallback
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("es-DO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp))
}
