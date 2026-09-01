import type { LaboratoryOrder, LaboratoryOrderStatus } from "@/features/laboratory/types"

const dateTimeFormatter = new Intl.DateTimeFormat("es-DO", {
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
  weekday: "short",
  year: "numeric",
})

const dateFormatter = new Intl.DateTimeFormat("es-DO", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
})

const testTypeLabels: Record<string, string> = {
  Ecografia: "Ecografía",
  Hemograma: "Hemograma",
  Orina: "Examen de orina",
  Radiografia: "Radiografía",
  Resonancia: "Resonancia magnética",
  Tac: "Tomografía (TAC)",
}

const statusLabels: Record<string, string> = {
  ResultadoCargado: "Resultado cargado",
  SolicitudPendiente: "Solicitud pendiente",
}

export function formatLaboratoryTestType(testType: string) {
  return testTypeLabels[testType] ?? testType
}

export function formatLaboratoryOrderStatus(status: LaboratoryOrderStatus) {
  return statusLabels[status] ?? status
}

export function formatLaboratoryDate(value: string, includeTime = true) {
  const timestamp = Date.parse(value)

  if (!Number.isFinite(timestamp)) {
    return "Fecha no válida"
  }

  const formatted = includeTime ? dateTimeFormatter.format(timestamp) : dateFormatter.format(timestamp)
  return capitalize(formatted)
}

export function sortLaboratoryOrders(orders: readonly LaboratoryOrder[]) {
  return [...orders].sort((first, second) => {
    const secondDate = Date.parse(second.requestedAt)
    const firstDate = Date.parse(first.requestedAt)

    return (Number.isFinite(secondDate) ? secondDate : 0) - (Number.isFinite(firstDate) ? firstDate : 0)
  })
}

export function formatLaboratoryResultValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "No registrado"
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No"
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("es-DO", { maximumFractionDigits: 2 }).format(value)
  }

  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(formatLaboratoryResultValue).join(", ")
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${formatLaboratoryResultLabel(key)}: ${formatLaboratoryResultValue(item)}`)
      .join(" · ")
  }

  return String(value)
}

export function formatLaboratoryResultLabel(key: string) {
  const labels: Record<string, string> = {
    conContraste: "Con contraste",
    conclusion: "Conclusión",
    densidad: "Densidad",
    glucosa: "Glucosa",
    hallazgos: "Hallazgos",
    hematocrito: "Hematocrito",
    hemoglobina: "Hemoglobina",
    impresion: "Impresión",
    leucocitos: "Leucocitos",
    organo: "Órgano",
    ph: "pH",
    plaquetas: "Plaquetas",
    proteinas: "Proteínas",
    region: "Región",
    secuencias: "Secuencias",
  }

  return labels[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (character) => character.toUpperCase())
}

export function getLaboratoryResultEntries(results: Record<string, unknown> | null | undefined) {
  return results ? Object.entries(results) : []
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
