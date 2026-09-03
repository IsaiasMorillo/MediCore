import { Plus, RefreshCw, Search, UserCheck, UserRound, UserX } from "lucide-react"
import { useDeferredValue, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { EmptyState, ErrorState, FilterBar, PaginationPlaceholder, SearchInput, SkeletonTable } from "@/components/ui"
import { PatientList } from "@/features/patients/components/patient-list"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { getPatientErrorMessage } from "@/features/patients/utils/patient-errors"
import { hasAnyRole } from "@/lib/permissions/roles"
import { PATIENT_WRITE_ROLES } from "@/lib/permissions/route-roles"
import { useAuthSession } from "@/lib/auth/use-auth-session"

const PAGE_SIZE = 8
type StatusFilter = "all" | "active" | "inactive"

export function PatientsPage() {
  const { session } = useAuthSession()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const deferredSearch = useDeferredValue(searchTerm.trim())
  const patientsQuery = usePatients(deferredSearch)
  const allPatients = patientsQuery.data ?? []
  const filteredPatients = allPatients.filter((patient) => {
    if (statusFilter === "active") {
      return patient.isActive
    }

    if (statusFilter === "inactive") {
      return !patient.isActive
    }

    return true
  })
  const pageCount = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE))
  const canCreate = session ? hasAnyRole(session.user.roles, PATIENT_WRITE_ROLES) : false

  const currentPage = Math.min(page, pageCount)
  const currentVisiblePatients = filteredPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="space-y-7">
      <PageHeader
        actions={
          canCreate ? (
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong"
              to="/app/patients/new"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nuevo paciente
            </Link>
          ) : null
        }
        description="Consulta la información demográfica y clínica inicial de los pacientes autorizados para tu rol."
        eyebrow="Atención · Registro clínico"
        title="Pacientes"
      />

      <PatientMetrics patients={allPatients} />

      <FilterBar
        actions={
          <>
            <label className="sr-only" htmlFor="patient-status-filter">Filtrar por estado</label>
            <select
              className="h-11 rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
              id="patient-status-filter"
              onChange={(event) => {
                setPage(1)
                setStatusFilter(event.target.value as StatusFilter)
              }}
              value={statusFilter}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo activos</option>
              <option value="inactive">Solo inactivos</option>
            </select>
            <button
              aria-label="Actualizar pacientes"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-panel-raised px-3.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink disabled:cursor-wait disabled:opacity-60"
              disabled={patientsQuery.isFetching}
              onClick={() => void patientsQuery.refetch()}
              type="button"
            >
              <RefreshCw aria-hidden="true" className={patientsQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </>
        }
        ariaLabel="Filtros de pacientes"
        description={
          <span>
            {patientsQuery.isFetching ? "Actualizando resultados..." : `${filteredPatients.length} paciente${filteredPatients.length === 1 ? "" : "s"} visible${filteredPatients.length === 1 ? "" : "s"}.`}
            {deferredSearch ? " La búsqueda incluye nombre, apellido y documento." : ""}
          </span>
        }
      >
        <SearchInput
          label="Buscar pacientes"
          onChange={(value) => {
            setPage(1)
            setSearchTerm(value)
          }}
          placeholder="Nombre, apellido o documento"
          value={searchTerm}
        />
      </FilterBar>

      <section className="mt-4 overflow-hidden rounded-[1.35rem] border border-line/80 bg-panel shadow-[0_20px_55px_-38px_var(--ink)]">
        {patientsQuery.isPending ? <PatientsLoadingState /> : null}
        {patientsQuery.isError ? (
          <PatientsErrorState
            message={getPatientErrorMessage(patientsQuery.error, "No pudimos cargar los pacientes.")}
            onRetry={() => void patientsQuery.refetch()}
          />
        ) : null}
        {!patientsQuery.isPending && !patientsQuery.isError && filteredPatients.length === 0 ? (
          <PatientsEmptyState
            canCreate={canCreate}
            hasFilters={Boolean(deferredSearch) || statusFilter !== "all"}
            onClearFilters={() => {
              setPage(1)
              setSearchTerm("")
              setStatusFilter("all")
            }}
          />
        ) : null}
        {!patientsQuery.isPending && !patientsQuery.isError && filteredPatients.length > 0 ? (
          <>
            <PatientList patients={currentVisiblePatients} />
            <PaginationPlaceholder page={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </>
        ) : null}
      </section>
    </div>
  )
}

function PatientMetrics({ patients }: { patients: readonly { isActive: boolean }[] }) {
  const activeCount = patients.filter((patient) => patient.isActive).length
  const inactiveCount = patients.length - activeCount

  return (
    <section aria-label="Resumen de pacientes" className="grid gap-4 sm:grid-cols-3">
      <MetricCard icon={<UserRound aria-hidden="true" className="h-4 w-4" />} label="Registros encontrados" value={patients.length} />
      <MetricCard icon={<UserCheck aria-hidden="true" className="h-4 w-4" />} label="Pacientes activos" value={activeCount} />
      <MetricCard icon={<UserX aria-hidden="true" className="h-4 w-4" />} label="Registros inactivos" value={inactiveCount} />
    </section>
  )
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <article className="rounded-[1.2rem] border border-line/80 bg-panel p-4 shadow-[0_16px_40px_-32px_var(--ink)]">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">{icon}</span>
        <span className="font-display text-2xl font-semibold tracking-[-0.05em] text-ink">{value}</span>
      </div>
      <p className="mt-3 text-xs font-medium text-ink-muted">{label}</p>
    </article>
  )
}

function PatientsLoadingState() {
  return <SkeletonTable columns={4} rows={4} />
}

function PatientsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <ErrorState description={message} onRetry={onRetry} title="No pudimos cargar los pacientes" />
}

function PatientsEmptyState({
  canCreate,
  hasFilters,
  onClearFilters,
}: {
  canCreate: boolean
  hasFilters: boolean
  onClearFilters: () => void
}) {
  return <EmptyState action={<>{hasFilters ? <button className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" onClick={onClearFilters} type="button">Limpiar filtros</button> : null}{canCreate ? <Link className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" to="/app/patients/new"><Plus aria-hidden="true" className="h-3.5 w-3.5" />Registrar paciente</Link> : null}</>} description={hasFilters ? "Prueba con otro nombre, documento o estado para ampliar los resultados." : "Registra el primer paciente para comenzar a centralizar su información."} icon={<Search aria-hidden="true" className="h-5 w-5" />} title={hasFilters ? "No encontramos pacientes con esos filtros" : "Todavía no hay pacientes registrados"} />
}
