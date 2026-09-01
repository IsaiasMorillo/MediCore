import type { Patient } from "@/features/patients/types"

const dateFormatter = new Intl.DateTimeFormat("es-DO", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
})

export function formatPatientName(patient: Pick<Patient, "personalData">) {
  return `${patient.personalData.firstName} ${patient.personalData.lastName}`.trim()
}

export function getPatientInitials(patient: Pick<Patient, "personalData">) {
  return `${patient.personalData.firstName} ${patient.personalData.lastName}`
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "P"
}

export function formatPatientDate(value: string | null | undefined) {
  if (!value) {
    return "No registrada"
  }

  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp) ? dateFormatter.format(timestamp) : "Fecha no válida"
}

export function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return ""
  }

  const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]

  if (datePart) {
    return datePart
  }

  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : ""
}

export function formatPatientContact(patient: Pick<Patient, "contacts">) {
  const primaryContact = patient.contacts.find((contact) => contact.type === "Phone") ?? patient.contacts[0]

  return primaryContact?.value || primaryContact?.phone || "Sin contacto registrado"
}

export function listToText(values: readonly string[] | undefined) {
  return values?.join("\n") ?? ""
}

export function textToList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}
