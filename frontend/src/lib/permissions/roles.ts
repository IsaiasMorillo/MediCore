export const USER_ROLES = [
  "Admin",
  "Medico",
  "Enfermero",
  "Recepcion",
  "Laboratorio",
  "Farmacia",
  "Paciente",
] as const

export type UserRole = (typeof USER_ROLES)[number]

export const INTERNAL_ROLES = [
  "Admin",
  "Medico",
  "Enfermero",
  "Recepcion",
  "Laboratorio",
  "Farmacia",
] as const satisfies readonly UserRole[]

export const ROLE_LABELS: Record<UserRole, string> = {
  Admin: "Administrador",
  Medico: "Médico",
  Enfermero: "Enfermería",
  Recepcion: "Recepción",
  Laboratorio: "Laboratorio",
  Farmacia: "Farmacia",
  Paciente: "Paciente",
}

export function isSupportedRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value)
}

export function normalizeRoles(values: readonly string[]): UserRole[] {
  return Array.from(new Set(values.filter(isSupportedRole)))
}

export function hasRole(roles: readonly UserRole[], role: UserRole) {
  return roles.includes(role)
}

export function hasAnyRole(
  roles: readonly UserRole[],
  allowedRoles: readonly UserRole[]
) {
  return allowedRoles.some((role) => roles.includes(role))
}

export function isInternalRole(role: UserRole) {
  return (INTERNAL_ROLES as readonly UserRole[]).includes(role)
}

export function isInternalUser(roles: readonly UserRole[]) {
  return hasAnyRole(roles, INTERNAL_ROLES)
}
