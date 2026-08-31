import {
  normalizeRoles,
  type UserRole,
} from "@/lib/permissions/roles"

export const SESSION_STORAGE_KEY = "medicore.auth.session"

export interface SessionUser {
  userId: string
  fullName: string
  email: string
  roles: UserRole[]
}

export interface AuthSession {
  token: string
  expiresAt: string
  user: SessionUser
}

export interface LoginResponse {
  token: string
  expiresAt: string
  user: {
    userId: string
    fullName: string
    email: string
    roles: string[]
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function isSessionExpired(
  session: Pick<AuthSession, "expiresAt">,
  now = Date.now()
) {
  const expiresAt = Date.parse(session.expiresAt)
  return !Number.isFinite(expiresAt) || expiresAt <= now
}

export function sessionFromLoginResponse(response: LoginResponse): AuthSession {
  return {
    token: response.token,
    expiresAt: response.expiresAt,
    user: {
      userId: response.user.userId,
      fullName: response.user.fullName,
      email: response.user.email,
      roles: normalizeRoles(response.user.roles),
    },
  }
}

function isStoredSession(value: unknown): value is AuthSession {
  if (!isRecord(value) || typeof value.token !== "string" || typeof value.expiresAt !== "string") {
    return false
  }

  if (!isRecord(value.user)) {
    return false
  }

  return (
    typeof value.user.userId === "string" &&
    typeof value.user.fullName === "string" &&
    typeof value.user.email === "string" &&
    Array.isArray(value.user.roles) &&
    value.user.roles.every((role) => typeof role === "string")
  )
}

export function readStoredSession(storage?: Storage | null) {
  const sessionStorage =
    storage ?? (typeof window !== "undefined" ? window.sessionStorage : null)

  if (!sessionStorage) {
    return null
  }

  try {
    const storedValue = sessionStorage.getItem(SESSION_STORAGE_KEY)

    if (!storedValue) {
      return null
    }

    const parsedValue = JSON.parse(storedValue) as unknown

    if (!isStoredSession(parsedValue) || isSessionExpired(parsedValue)) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    return {
      ...parsedValue,
      user: {
        ...parsedValue.user,
        roles: normalizeRoles(parsedValue.user.roles),
      },
    }
  } catch {
    return null
  }
}

export function getUserInitials(fullName: string) {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return initials || "MC"
}
