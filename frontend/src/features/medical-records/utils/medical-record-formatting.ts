import type { MedicalRecord, VitalSigns } from "@/features/medical-records/types"

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

const numberFormatter = new Intl.NumberFormat("es-DO", {
  maximumFractionDigits: 1,
})

export function formatMedicalRecordDate(value: string) {
  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp) ? capitalize(dateTimeFormatter.format(timestamp)) : "Fecha no válida"
}

export function formatMedicalRecordDateOnly(value: string) {
  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp) ? capitalize(dateFormatter.format(timestamp)) : "Fecha no válida"
}

export function formatVitalSign(value: number | null | undefined, unit: string) {
  return value === null || value === undefined ? "No registrado" : `${numberFormatter.format(value)} ${unit}`
}

export function formatVitalSignsSummary(vitalSigns: VitalSigns) {
  return [
    vitalSigns.bloodPressure ? `${vitalSigns.bloodPressure} mmHg` : "Presión no registrada",
    vitalSigns.heartRate == null ? null : formatVitalSign(vitalSigns.heartRate, "bpm"),
    vitalSigns.temperature == null ? null : formatVitalSign(vitalSigns.temperature, "°C"),
    vitalSigns.weightKg == null ? null : formatVitalSign(vitalSigns.weightKg, "kg"),
  ].filter(Boolean).join(" · ")
}

export function sortMedicalRecords(records: readonly MedicalRecord[]) {
  return [...records].sort((first, second) => {
    const secondDate = Date.parse(second.consultationDate)
    const firstDate = Date.parse(first.consultationDate)

    return (Number.isFinite(secondDate) ? secondDate : 0) - (Number.isFinite(firstDate) ? firstDate : 0)
  })
}

export function listClinicalValues(values: readonly string[]) {
  return values.filter(Boolean)
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
