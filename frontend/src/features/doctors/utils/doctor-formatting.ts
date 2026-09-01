import type { Doctor, DoctorScheduleShift } from "@/features/doctors/types"

export const DOCTOR_DAYS = [
  { label: "Domingo", value: "Sunday" },
  { label: "Lunes", value: "Monday" },
  { label: "Martes", value: "Tuesday" },
  { label: "Miércoles", value: "Wednesday" },
  { label: "Jueves", value: "Thursday" },
  { label: "Viernes", value: "Friday" },
  { label: "Sábado", value: "Saturday" },
] as const

const dayLabels = new Map<string, string>(DOCTOR_DAYS.map((day) => [day.value, day.label]))
const numericDays = DOCTOR_DAYS.reduce<Record<number, string>>((result, day, index) => {
  result[index] = day.value
  return result
}, {})

export function formatDoctorName(doctor: Pick<Doctor, "firstName" | "lastName">) {
  return `${doctor.firstName} ${doctor.lastName}`.trim()
}

export function getDoctorInitials(doctor: Pick<Doctor, "firstName" | "lastName">) {
  return formatDoctorName(doctor)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "M"
}

export function formatDoctorDay(day: string | number) {
  const normalizedDay = normalizeDoctorDay(day)
  return dayLabels.get(normalizedDay) ?? String(day)
}

export function normalizeDoctorDay(day: string | number) {
  if (typeof day === "number") {
    return numericDays[day] ?? "Monday"
  }

  const normalized = day.trim()
  const numericValue = Number(normalized)

  if (normalized && Number.isInteger(numericValue) && numericDays[numericValue]) {
    return numericDays[numericValue]
  }

  return normalized || "Monday"
}

export function formatDoctorTime(value: string) {
  return value.match(/^\d{2}:\d{2}/)?.[0] ?? value
}

export function formatDoctorShift(shift: DoctorScheduleShift) {
  return `${formatDoctorDay(shift.day)} · ${formatDoctorTime(shift.startTime)}–${formatDoctorTime(shift.endTime)}`
}

export function getSortedDoctorSchedule(schedule: readonly DoctorScheduleShift[]) {
  const order = new Map<string, number>(DOCTOR_DAYS.map((day, index) => [day.value, index]))

  return [...schedule].sort((first, second) => {
    const firstOrder = order.get(normalizeDoctorDay(first.day)) ?? Number.MAX_SAFE_INTEGER
    const secondOrder = order.get(normalizeDoctorDay(second.day)) ?? Number.MAX_SAFE_INTEGER

    return firstOrder - secondOrder || first.startTime.localeCompare(second.startTime)
  })
}
