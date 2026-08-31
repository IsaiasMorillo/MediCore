import {
  CalendarDays,
  ClipboardList,
  FileHeart,
  FlaskConical,
  Pill,
  ReceiptText,
  UsersRound,
  type LucideIcon,
} from "lucide-react"
import { Link } from "react-router-dom"

import {
  BILLING_ROLES,
  CLINICAL_ROLES,
  INTERNAL_ROLES,
  LABORATORY_ROLES,
  PHARMACY_ROLES,
} from "@/lib/permissions/route-roles"
import { hasAnyRole, type UserRole } from "@/lib/permissions/roles"

interface QuickAction {
  label: string
  description: string
  path: string
  icon: LucideIcon
  roles: readonly UserRole[]
}

const quickActions: readonly QuickAction[] = [
  {
    label: "Buscar paciente",
    description: "Consultar un expediente",
    path: "/app/patients",
    icon: UsersRound,
    roles: INTERNAL_ROLES,
  },
  {
    label: "Ver disponibilidad",
    description: "Revisar espacios de atención",
    path: "/app/appointments",
    icon: CalendarDays,
    roles: INTERNAL_ROLES,
  },
  {
    label: "Expedientes",
    description: "Abrir historial clínico",
    path: "/app/medical-records",
    icon: ClipboardList,
    roles: CLINICAL_ROLES,
  },
  {
    label: "Registrar signos vitales",
    description: "Capturar una medición clínica",
    path: "/app/nursing",
    icon: FileHeart,
    roles: ["Admin", "Medico", "Enfermero"],
  },
  {
    label: "Laboratorio",
    description: "Consultar órdenes y resultados",
    path: "/app/laboratory",
    icon: FlaskConical,
    roles: LABORATORY_ROLES,
  },
  {
    label: "Farmacia",
    description: "Revisar medicamentos y stock",
    path: "/app/pharmacy",
    icon: Pill,
    roles: PHARMACY_ROLES,
  },
  {
    label: "Facturación",
    description: "Gestionar facturas por paciente",
    path: "/app/billing",
    icon: ReceiptText,
    roles: BILLING_ROLES,
  },
]

export function QuickActions({ roles }: { roles: readonly UserRole[] }) {
  const visibleActions = quickActions.filter((action) => hasAnyRole(roles, action.roles))

  return (
    <section aria-labelledby="quick-actions-title" className="panel-shadow rounded-[1.35rem] border border-line/80 bg-panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-brand-strong">
            Acciones frecuentes
          </p>
          <h2 className="mt-1.5 font-display text-lg font-semibold tracking-[-0.035em] text-ink" id="quick-actions-title">
            Continúa tu trabajo
          </h2>
        </div>
        <span className="rounded-lg bg-brand-soft px-2 py-1.5 text-[0.65rem] font-semibold text-brand-strong">
          Según tu rol
        </span>
      </div>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {visibleActions.slice(0, 4).map((action) => {
          const Icon = action.icon

          return (
            <Link
              className="group flex min-w-0 items-center gap-3 rounded-xl border border-line/70 bg-panel-raised p-3 transition-colors hover:border-brand/40 hover:bg-brand-soft/25 focus-visible:outline-none"
              key={action.path}
              to={action.path}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-canvas text-brand-strong transition-colors group-hover:bg-brand-soft">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-ink">{action.label}</span>
                <span className="mt-0.5 block truncate text-[0.68rem] text-ink-subtle">{action.description}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
