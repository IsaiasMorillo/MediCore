import { ApiError } from "@/lib/api/client"

export function getAppointmentErrorMessage(
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
    return error.message || "No encontramos la cita o el recurso solicitado."
  }

  if (error.status === 409) {
    return error.message || "El horario solicitado ya no está disponible."
  }

  return error.message || fallback
}
