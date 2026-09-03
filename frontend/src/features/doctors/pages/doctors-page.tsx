import { BriefcaseMedical, Plus, RefreshCw, Search, UserCheck, UserX } from "lucide-react"
import { useDeferredValue, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
import { EmptyState, ErrorState, FilterBar, PaginationPlaceholder, SearchInput, SkeletonTable } from "@/components/ui"
import { DoctorList } from "@/features/doctors/components/doctor-list"
import { useDoctors } from "@/features/doctors/hooks/use-doctors"
import { getDoctorErrorMessage } from "@/features/doctors/utils/doctor-errors"
import { hasAnyRole } from "@/lib/permissions/roles"
import { DOCTOR_MANAGE_ROLES } from "@/lib/permissions/route-roles"
import { useAuthSession } from "@/lib/auth/use-auth-session"

const PAGE_SIZE = 8
type StatusFilter = "all" | "active" | "inactive"

export function DoctorsPage() {
  const { session } = useAuthSession()
  const [searchTerm, setSearchTerm] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const deferredSearch = useDeferredValue(searchTerm.trim())
  const doctorsQuery = useDoctors({ searchTerm: deferredSearch })
  const allDoctors = doctorsQuery.data ?? []
  const specialties = Array.from(new Set(allDoctors.map((doctor) => doctor.specialty.trim()).filter(Boolean))).sort((first, second) => first.localeCompare(second, "es"))
  const filteredDoctors = allDoctors.filter((doctor) => {
    const matchesSpecialty = specialtyFilter === "all" || doctor.specialty === specialtyFilter
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? doctor.isActive : !doctor.isActive)

    return matchesSpecialty && matchesStatus
  })
  const pageCount = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleDoctors = filteredDoctors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const canManage = session ? hasAnyRole(session.user.roles, DOCTOR_MANAGE_ROLES) : false

  return (
    <div className="space-y-7">
      <PageHeader
        actions={
          canManage ? (
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-16px_var(--brand)] transition-colors hover:bg-brand-strong"
              to="/app/doctors/new"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nuevo médico
            </Link>
          ) : null
        }
        description="Consulta el equipo médico, sus especialidades y los turnos configurados para la operación clínica."
        eyebrow="Atención · Equipo médico"
        title="Médicos"
      />

      <DoctorMetrics doctors={allDoctors} />

      <FilterBar
        actions={
          <>
            <label className="sr-only" htmlFor="doctor-specialty-filter">Filtrar por especialidad</label>
            <select
              className="h-11 min-w-48 rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
              id="doctor-specialty-filter"
              onChange={(event) => {
                setPage(1)
                setSpecialtyFilter(event.target.value)
              }}
              value={specialtyFilter}
            >
              <option value="all">Todas las especialidades</option>
              {specialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
            </select>
            <label className="sr-only" htmlFor="doctor-status-filter">Filtrar por estado</label>
            <select
              className="h-11 rounded-xl border border-line bg-panel-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
              id="doctor-status-filter"
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
              aria-label="Actualizar médicos"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-panel-raised px-3.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink disabled:cursor-wait disabled:opacity-60"
              disabled={doctorsQuery.isFetching}
              onClick={() => void doctorsQuery.refetch()}
              type="button"
            >
              <RefreshCw aria-hidden="true" className={doctorsQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </>
        }
        ariaLabel="Filtros de médicos"
        description={
          <span>
            {doctorsQuery.isFetching ? "Actualizando resultados..." : `${filteredDoctors.length} médico${filteredDoctors.length === 1 ? "" : "s"} visible${filteredDoctors.length === 1 ? "" : "s"}.`}
            {deferredSearch ? " La búsqueda incluye nombre, apellido y especialidad." : ""}
          </span>
        }
      >
        <SearchInput
          label="Buscar médicos"
          onChange={(value) => {
            setPage(1)
            setSearchTerm(value)
          }}
          placeholder="Nombre, apellido o especialidad"
          value={searchTerm}
        />
      </FilterBar>

      <section className="mt-4 overflow-hidden rounded-[1.35rem] border border-line/80 bg-panel shadow-[0_20px_55px_-38px_var(--ink)]">
        {doctorsQuery.isPending ? <DoctorsLoadingState /> : null}
        {doctorsQuery.isError ? (
          <DoctorsErrorState
            message={getDoctorErrorMessage(doctorsQuery.error, "No pudimos cargar los médicos.")}
            onRetry={() => void doctorsQuery.refetch()}
          />
        ) : null}
        {!doctorsQuery.isPending && !doctorsQuery.isError && filteredDoctors.length === 0 ? (
          <DoctorsEmptyState
            canManage={canManage}
            hasFilters={Boolean(deferredSearch) || specialtyFilter !== "all" || statusFilter !== "all"}
            onClearFilters={() => {
              setPage(1)
              setSearchTerm("")
              setSpecialtyFilter("all")
              setStatusFilter("all")
            }}
          />
        ) : null}
        {!doctorsQuery.isPending && !doctorsQuery.isError && filteredDoctors.length > 0 ? (
          <>
            <DoctorList doctors={visibleDoctors} />
            <PaginationPlaceholder page={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </>
        ) : null}
      </section>
    </div>
  )
}

function DoctorMetrics({ doctors }: { doctors: readonly { isActive: boolean; specialty: string }[] }) {
  const activeCount = doctors.filter((doctor) => doctor.isActive).length
  const specialtyCount = new Set(doctors.map((doctor) => doctor.specialty)).size

  return (
    <section aria-label="Resumen de médicos" className="grid gap-4 sm:grid-cols-3">
      <MetricCard icon={<BriefcaseMedical aria-hidden="true" className="h-4 w-4" />} label="Especialistas registrados" value={doctors.length} />
      <MetricCard icon={<UserCheck aria-hidden="true" className="h-4 w-4" />} label="Médicos activos" value={activeCount} />
      <MetricCard icon={<UserX aria-hidden="true" className="h-4 w-4" />} label="Especialidades" value={specialtyCount} />
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

function DoctorsLoadingState() {
  return <SkeletonTable columns={5} rows={4} />
}

function DoctorsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <ErrorState description={message} onRetry={onRetry} title="No pudimos cargar los médicos" />
}

function DoctorsEmptyState({
  canManage,
  hasFilters,
  onClearFilters,
}: {
  canManage: boolean
  hasFilters: boolean
  onClearFilters: () => void
}) {
  return <EmptyState action={<>{hasFilters ? <button className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink" onClick={onClearFilters} type="button">Limpiar filtros</button> : null}{canManage ? <Link className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong" to="/app/doctors/new"><Plus aria-hidden="true" className="h-3.5 w-3.5" />Registrar médico</Link> : null}</>} description={hasFilters ? "Prueba con otro nombre, especialidad o estado para ampliar los resultados." : "Registra el primer especialista para comenzar a configurar la agenda clínica."} icon={<Search aria-hidden="true" className="h-5 w-5" />} title={hasFilters ? "No encontramos médicos con esos filtros" : "Todavía no hay médicos registrados"} />
}
