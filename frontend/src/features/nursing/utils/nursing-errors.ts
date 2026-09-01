import { ApiError } from "@/lib/api/client"

export function getNursingErrorMessage(
  error: unknown,
  fallback = "No pudimos completar la operación de enfermería. Intenta nuevamente."
) {
  if (!(error instanceof ApiError)) {
    return fallback
  }

  if (error.status === 401) {
    return "Tu sesión ya no es válida. Inicia sesión nuevamente."
  }

  if (error.status === 403) {
    return "No tienes permisos para consultar o registrar signos vitales."
  }

  if (error.status === 404) {
    return error.message || "No encontramos el paciente solicitado."
  }

  return error.message || fallback
}
