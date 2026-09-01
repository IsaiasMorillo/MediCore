import { ApiError } from "@/lib/api/client"

export function getBillingErrorMessage(
  error: unknown,
  fallback = "No pudimos completar la operación de facturación. Intenta nuevamente."
) {
  if (!(error instanceof ApiError)) {
    return fallback
  }

  if (error.status === 401) {
    return "Tu sesión ya no es válida. Inicia sesión nuevamente."
  }

  if (error.status === 403) {
    return "No tienes permisos para consultar o modificar facturas."
  }

  if (error.status === 404) {
    return error.message || "No encontramos la factura o el paciente solicitado."
  }

  if (error.status === 409) {
    return error.message || "La factura no puede modificarse con su estado o saldo actual."
  }

  return error.message || fallback
}
