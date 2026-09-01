import { BriefcaseMedical, ChevronLeft, ChevronRight, Plus, RefreshCw, Search, UserCheck, UserX } from "lucide-react"
import { useDeferredValue, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/layout/page-header"
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

      <section className="overflow-hidden rounded-[1.35rem] border border-line/80 bg-panel shadow-[0_20px_55px_-38px_var(--ink)]">
        <div className="border-b border-line/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Buscar médicos</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input
                aria-label="Buscar médicos"
                className="h-11 w-full rounded-xl border border-line bg-panel-raised pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand/60 focus:ring-2 focus:ring-brand/10"
                onChange={(event) => {
                  setPage(1)
                  setSearchTerm(event.target.value)
                }}
                placeholder="Nombre, apellido o especialidad"
                type="search"
                value={searchTerm}
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[0.68rem] text-ink-subtle">
            <span aria-live="polite">
              {doctorsQuery.isFetching ? "Actualizando resultados..." : `${filteredDoctors.length} médico${filteredDoctors.length === 1 ? "" : "s"} visible${filteredDoctors.length === 1 ? "" : "s"}`}
            </span>
            {deferredSearch ? <span>La búsqueda incluye nombre, apellido y especialidad.</span> : null}
          </div>
        </div>

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
            <DoctorsPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
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
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-3 p-4 sm:p-5">
      {[0, 1, 2, 3].map((row) => (
        <div className="flex animate-pulse items-center gap-3 rounded-2xl border border-line/60 px-4 py-4" key={row}>
          <span className="h-10 w-10 rounded-xl bg-line/60" />
          <span className="h-3 w-40 rounded-full bg-line/60" />
          <span className="ml-auto hidden h-3 w-24 rounded-full bg-line/60 sm:block" />
        </div>
      ))}
    </div>
  )
}

function DoctorsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center" role="alert">
      <p className="text-sm font-semibold text-ink">No pudimos cargar los médicos</p>
      <p className="mt-2 max-w-sm text-xs leading-5 text-ink-muted">{message}</p>
      <button
        className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong"
        onClick={onRetry}
        type="button"
      >
        Intentar nuevamente
      </button>
    </div>
  )
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
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
        <Search aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-ink">
        {hasFilters ? "No encontramos médicos con esos filtros" : "Todavía no hay médicos registrados"}
      </p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">
        {hasFilters
          ? "Prueba con otro nombre, especialidad o estado para ampliar los resultados."
          : "Registra el primer especialista para comenzar a configurar la agenda clínica."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {hasFilters ? (
          <button
            className="rounded-xl border border-line bg-panel-raised px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
            onClick={onClearFilters}
            type="button"
          >
            Limpiar filtros
          </button>
        ) : null}
        {canManage ? (
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong"
            to="/app/doctors/new"
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Registrar médico
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function DoctorsPagination({
  onPageChange,
  page,
  pageCount,
}: {
  onPageChange: (page: number) => void
  page: number
  pageCount: number
}) {
  if (pageCount <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-between border-t border-line/70 px-4 py-3 sm:px-5">
      <p className="text-xs text-ink-subtle">Página {page} de {pageCount}</p>
      <div className="flex items-center gap-2">
        <button
          aria-label="Página anterior"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel-raised text-ink-muted transition-colors hover:border-brand/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          aria-label="Página siguiente"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel-raised text-ink-muted transition-colors hover:border-brand/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
