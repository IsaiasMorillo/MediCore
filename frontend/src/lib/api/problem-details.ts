export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  error?: string
  traceId?: string
}

const fallbackMessages: Record<number, string> = {
  400: "La solicitud no es válida.",
  401: "Tu sesión ya no es válida.",
  403: "No tienes permisos para realizar esta acción.",
  404: "No encontramos el recurso solicitado.",
  409: "La operación entra en conflicto con el estado actual.",
  500: "Ocurrió un error inesperado en el servidor.",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined
}

export function parseProblemDetails(value: unknown): ProblemDetails | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  return {
    type: asString(value.type),
    title: asString(value.title),
    status: typeof value.status === "number" ? value.status : undefined,
    detail: asString(value.detail),
    error: asString(value.error),
    traceId: asString(value.traceId),
  }
}

export function getProblemMessage(
  problem: ProblemDetails | undefined,
  status?: number
) {
  return (
    problem?.detail ??
    problem?.error ??
    problem?.title ??
    (status === 0
      ? "No pudimos conectar con MediCore. Revisa la disponibilidad del servidor."
      : status !== undefined
        ? fallbackMessages[status]
        : undefined) ??
    "No pudimos completar la solicitud. Intenta nuevamente."
  )
}
