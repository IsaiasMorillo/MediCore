import { ApiError } from "@/lib/api/client"

export function getPatientErrorMessage(
  error: unknown,
  fallback = "No pudimos completar la operación. Intenta nuevamente."
) {
  if (!(error instanceof ApiError)) {
    return fallback
  }

  if (error.status === 401) {
    return "Tu sesión ya no es válida. Inicia sesión nuevamente."
  }

  if (error.status === 403) {
    return "No tienes permisos para realizar esta acción."
  }

  if (error.status === 404) {
    return "No encontramos el paciente solicitado."
  }

  if (error.status === 409) {
    return error.message || "Ya existe un paciente con esos datos."
  }

  return error.message || fallback
}
