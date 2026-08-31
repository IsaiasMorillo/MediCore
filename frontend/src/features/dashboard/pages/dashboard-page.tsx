import { RefreshCw, ShieldCheck } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { PageHeader } from "@/components/layout/page-header"
import { RoleBadge } from "@/components/layout/role-badge"
import { useAuthSession } from "@/lib/auth/use-auth-session"
import { getUserInitials } from "@/lib/auth/session"
import type { UserRole } from "@/lib/permissions/roles"
import { DashboardReports } from "@/features/dashboard/components/dashboard-sections"
import { QuickActions } from "@/features/dashboard/components/quick-actions"
import { useDashboardReports } from "@/features/dashboard/hooks/use-dashboard-reports"

const dateFormatter = new Intl.DateTimeFormat("es-DO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})
const timeFormatter = new Intl.DateTimeFormat("es-DO", {
  hour: "numeric",
  minute: "2-digit",
})

export function DashboardPage() {
  const { session } = useAuthSession()
  const shouldReduceMotion = useReducedMotion()
  const reports = useDashboardReports()

  if (!session) {
    return null
  }

  const firstName = session.user.fullName.trim().split(/\s+/)[0] || "equipo"
  const formattedDate = capitalize(dateFormatter.format(new Date()))
  const lastUpdatedLabel = reports.lastUpdatedAt
    ? `Actualizado ${timeFormatter.format(new Date(reports.lastUpdatedAt))}`
    : "Datos bajo demanda"

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <PageHeader
        actions={
          <>
            <span aria-live="polite" className="mr-1 hidden text-[0.68rem] text-ink-subtle sm:inline">
              {reports.isFetching ? "Actualizando reportes..." : lastUpdatedLabel}
            </span>
            <button
              aria-label="Actualizar reportes del dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel text-ink-muted shadow-sm transition-colors hover:border-brand/40 hover:text-ink focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
              disabled={reports.isFetching}
              onClick={() => void reports.refresh()}
              title="Actualizar reportes"
              type="button"
            >
              <RefreshCw aria-hidden="true" className={reports.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </button>
          </>
        }
        description={`${formattedDate}. Consulta las capacidades disponibles para tu rol sin salir del área operativa.`}
        eyebrow="MediCore · Área interna"
        title={`Buenos días, ${firstName}`}
      />

      <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <QuickActions roles={session.user.roles} />
        <AccessContext roles={session.user.roles} expiresAt={session.expiresAt} fullName={session.user.fullName} />
      </section>

      <DashboardReports reports={reports} />

      <footer className="mt-7 flex flex-col gap-2 border-t border-line/70 pt-4 text-[0.68rem] text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
        <span>Las acciones y datos visibles dependen de los permisos de tu sesión.</span>
        <span>{lastUpdatedLabel}</span>
      </footer>
    </motion.div>
  )
}

function AccessContext({
  roles,
  expiresAt,
  fullName,
}: {
  roles: readonly UserRole[]
  expiresAt: string
  fullName: string
}) {
  return (
    <section aria-labelledby="access-context-title" className="panel-shadow rounded-[1.35rem] border border-line/80 bg-ink p-5 text-white sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-soft">Sesión activa</p>
          <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em]" id="access-context-title">
            Espacio de trabajo protegido
          </h2>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-brand-soft">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
          {getUserInitials(fullName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{fullName}</p>
          <p className="mt-0.5 truncate text-xs text-white/60">Sesión válida hasta {formatExpiry(expiresAt)}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {roles.map((role) => <RoleBadge key={role} role={role} />)}
      </div>
      <p className="mt-5 text-xs leading-5 text-white/60">
        MediCore valida nuevamente cada operación en el servidor. Ocultar una opción no reemplaza la autorización del backend.
      </p>
    </section>
  )
}

function formatExpiry(value: string) {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat("es-DO", { dateStyle: "short", timeStyle: "short" }).format(timestamp)
    : "una hora no disponible"
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
