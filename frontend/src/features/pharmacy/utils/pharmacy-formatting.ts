import type { Medication, Prescription, PrescriptionStatus } from "@/features/pharmacy/types"

const dateFormatter = new Intl.DateTimeFormat("es-DO", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
})

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

const prescriptionStatusLabels: Record<string, string> = {
  Cancelada: "Cancelada",
  Despachada: "Despachada",
  Emitida: "Emitida",
}

export function formatPharmacyDate(value: string | null | undefined, includeTime = false) {
  if (!value) {
    return "No registrada"
  }

  const timestamp = Date.parse(value)

  if (!Number.isFinite(timestamp)) {
    return "Fecha no válida"
  }

  const formatted = includeTime ? dateTimeFormatter.format(timestamp) : dateFormatter.format(timestamp)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatPharmacyCurrency(value: number) {
  return new Intl.NumberFormat("es-DO", { currency: "DOP", style: "currency" }).format(value)
}

export function formatPrescriptionStatus(status: PrescriptionStatus) {
  return prescriptionStatusLabels[status] ?? status
}

export function isLowStock(medication: Pick<Medication, "reorderLevel" | "stockQuantity">) {
  return medication.stockQuantity <= medication.reorderLevel
}

export function isMedicationExpired(medication: Pick<Medication, "expirationDate">, now = Date.now()) {
  if (!medication.expirationDate) {
    return false
  }

  const expirationTimestamp = Date.parse(medication.expirationDate)
  return Number.isFinite(expirationTimestamp) && expirationTimestamp < now
}

export function sortMedications(medications: readonly Medication[]) {
  return [...medications].sort((first, second) => first.name.localeCompare(second.name, "es"))
}

export function sortPrescriptions(prescriptions: readonly Prescription[]) {
  return [...prescriptions].sort((first, second) => {
    const firstStatus = first.status === "Emitida" ? 0 : first.status === "Despachada" ? 1 : 2
    const secondStatus = second.status === "Emitida" ? 0 : second.status === "Despachada" ? 1 : 2

    if (firstStatus !== secondStatus) {
      return firstStatus - secondStatus
    }

    return first.medicationName.localeCompare(second.medicationName, "es")
  })
}
