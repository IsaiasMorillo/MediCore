import { ApiError } from "@/lib/api/client"

export function getMedicalRecordErrorMessage(
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
    return "No tienes permisos para consultar o crear expedientes clínicos."
  }

  if (error.status === 404) {
    return error.message || "No encontramos el registro clínico solicitado."
  }

  if (error.status === 409) {
    return error.message || "Ya existe un registro clínico para esta consulta."
  }

  return error.message || fallback
}
