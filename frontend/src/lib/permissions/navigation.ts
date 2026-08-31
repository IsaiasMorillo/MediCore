import {
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Pill,
  ReceiptText,
  ShieldCheck,
  Stethoscope,
  UserRoundCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

import {
  hasAnyRole,
  type UserRole,
} from "@/lib/permissions/roles"
import {
  BILLING_ROLES,
  CLINICAL_ROLES,
  INTERNAL_ROLES,
  LABORATORY_ROLES,
  NURSING_ROLES,
  PHARMACY_ROLES,
  REPORT_ROLES,
} from "@/lib/permissions/route-roles"

export interface NavigationItem {
  id: string
  label: string
  description: string
  path: string
  icon: LucideIcon
  roles: readonly UserRole[]
}

export interface NavigationGroup {
  id: string
  label: string
  items: readonly NavigationItem[]
}

export const navigationGroups: readonly NavigationGroup[] = [
  {
    id: "principal",
    label: "Principal",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        description: "Resumen operativo de tu jornada",
        path: "/app",
        icon: LayoutDashboard,
        roles: INTERNAL_ROLES,
      },
    ],
  },
  {
    id: "attention",
    label: "Atención",
    items: [
      {
        id: "patients",
        label: "Pacientes",
        description: "Buscar y consultar pacientes",
        path: "/app/patients",
        icon: UsersRound,
        roles: INTERNAL_ROLES,
      },
      {
        id: "appointments",
        label: "Citas",
        description: "Consultar disponibilidad y citas",
        path: "/app/appointments",
        icon: CalendarDays,
        roles: INTERNAL_ROLES,
      },
      {
        id: "doctors",
        label: "Médicos",
        description: "Consultar el equipo médico",
        path: "/app/doctors",
        icon: Stethoscope,
        roles: INTERNAL_ROLES,
      },
    ],
  },
  {
    id: "clinical",
    label: "Clínica",
    items: [
      {
        id: "medical-records",
        label: "Expedientes",
        description: "Historiales clínicos",
        path: "/app/medical-records",
        icon: ClipboardList,
        roles: CLINICAL_ROLES,
      },
      {
        id: "nursing",
        label: "Enfermería",
        description: "Signos vitales y seguimiento",
        path: "/app/nursing",
        icon: ShieldCheck,
        roles: NURSING_ROLES,
      },
      {
        id: "laboratory",
        label: "Laboratorio",
        description: "Órdenes y resultados",
        path: "/app/laboratory",
        icon: FlaskConical,
        roles: LABORATORY_ROLES,
      },
      {
        id: "pharmacy",
        label: "Farmacia",
        description: "Medicamentos y prescripciones",
        path: "/app/pharmacy",
        icon: Pill,
        roles: PHARMACY_ROLES,
      },
    ],
  },
  {
    id: "administration",
    label: "Administración",
    items: [
      {
        id: "billing",
        label: "Facturación",
        description: "Facturas y pagos por paciente",
        path: "/app/billing",
        icon: ReceiptText,
        roles: BILLING_ROLES,
      },
      {
        id: "reports",
        label: "Reportes",
        description: "Indicadores autorizados por rol",
        path: "/app/reports",
        icon: FileText,
        roles: REPORT_ROLES,
      },
      {
        id: "accounts",
        label: "Cuentas",
        description: "Crear cuentas de acceso",
        path: "/app/admin/accounts",
        icon: UserRoundCog,
        roles: ["Admin"],
      },
    ],
  },
] as const

export function getVisibleNavigation(roles: readonly UserRole[]) {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAnyRole(roles, item.roles)),
    }))
    .filter((group) => group.items.length > 0)
}

export function isNavigationItemActive(pathname: string, itemPath: string) {
  if (itemPath === "/app") {
    return pathname === itemPath
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export function findNavigationItem(pathname: string) {
  return navigationGroups
    .flatMap((group) => group.items.map((item) => ({ group, item })))
    .filter(({ item }) => isNavigationItemActive(pathname, item.path))
    .sort(({ item: first }, { item: second }) => second.path.length - first.path.length)[0]
}
