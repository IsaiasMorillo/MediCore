import { ApiError } from "@/lib/api/client"

export function getPharmacyErrorMessage(
  error: unknown,
  fallback = "No pudimos completar la operación de farmacia. Intenta nuevamente."
) {
  if (!(error instanceof ApiError)) {
    return fallback
  }

  if (error.status === 401) {
    return "Tu sesión ya no es válida. Inicia sesión nuevamente."
  }

  if (error.status === 403) {
    return "No tienes permisos para consultar o modificar esta operación de farmacia."
  }

  if (error.status === 404) {
    return error.message || "No encontramos el medicamento, paciente o recurso solicitado."
  }

  if (error.status === 409) {
    return error.message || "La operación no puede completarse con el estado o stock actual."
  }

  return error.message || fallback
}
