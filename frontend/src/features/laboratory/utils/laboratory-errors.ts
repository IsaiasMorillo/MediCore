import { ApiError } from "@/lib/api/client"

export function getLaboratoryErrorMessage(
  error: unknown,
  fallback = "No pudimos completar la operación de laboratorio. Intenta nuevamente."
) {
  if (!(error instanceof ApiError)) {
    return fallback
  }

  if (error.status === 401) {
    return "Tu sesión ya no es válida. Inicia sesión nuevamente."
  }

  if (error.status === 403) {
    return "No tienes permisos para consultar o modificar órdenes de laboratorio."
  }

  if (error.status === 404) {
    return error.message || "No encontramos la orden o referencia clínica solicitada."
  }

  if (error.status === 409) {
    return error.message || "La orden ya tiene resultados cargados."
  }

  return error.message || fallback
}
