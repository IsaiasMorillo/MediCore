import type { AppointmentStatus } from "@/features/appointments/types"

const dateFormatter = new Intl.DateTimeFormat("es-DO", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  weekday: "long",
  year: "numeric",
})

const timeFormatter = new Intl.DateTimeFormat("es-DO", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  timeZone: "UTC",
})

const statusLabels: Record<AppointmentStatus, string> = {
  Cancelled: "Cancelada",
  Completed: "Completada",
  Confirmed: "Confirmada",
  Rescheduled: "Reprogramada",
  Scheduled: "Programada",
}

export function formatAppointmentStatus(status: AppointmentStatus) {
  return statusLabels[status] ?? status
}

export function formatAppointmentDate(value: string) {
  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp) ? capitalize(dateFormatter.format(timestamp)) : "Fecha no válida"
}

export function formatAppointmentTime(value: string) {
  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp) ? timeFormatter.format(timestamp) : "Hora no válida"
}

export function formatAppointmentDateTime(value: string, durationMinutes?: number) {
  const date = formatAppointmentDate(value)
  const time = formatAppointmentTime(value)

  return durationMinutes ? `${date} · ${time} · ${durationMinutes} min` : `${date} · ${time}`
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

export function toTimeInputValue(value: string | null | undefined) {
  if (!value) {
    return ""
  }

  const timePart = value.match(/(?:T|^)\d{2}:\d{2}/)?.[0]

  if (timePart) {
    return timePart.replace(/^T/, "")
  }

  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
        timeZone: "UTC",
      }).format(timestamp)
    : ""
}

export function toUtcDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00.000Z`).toISOString()
}

export function getDateInputValue(daysFromToday = 0) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + daysFromToday)
  return date.toISOString().slice(0, 10)
}

export function formatAppointmentSlot(value: string) {
  return formatAppointmentTime(value)
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
