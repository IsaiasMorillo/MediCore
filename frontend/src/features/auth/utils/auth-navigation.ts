import type { AuthSession } from "@/lib/auth/session"

export function getLandingPath(session: AuthSession) {
  return session.user.roles.includes("Paciente") ? "/portal" : "/app"
}
