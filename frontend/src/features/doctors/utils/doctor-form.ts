import type { DoctorFormValues } from "@/features/doctors/schemas/doctor-schemas"
import type {
  CreateDoctorInput,
  Doctor,
  DoctorScheduleShift,
  UpdateDoctorInput,
} from "@/features/doctors/types"
import { normalizeDoctorDay } from "@/features/doctors/utils/doctor-formatting"

const defaultShift: DoctorScheduleShift = {
  day: "Monday",
  endTime: "12:00",
  startTime: "08:00",
}

export function toCreateDoctorInput(values: DoctorFormValues): CreateDoctorInput {
  return {
    experienceYears: values.experienceYears,
    firstName: values.firstName,
    lastName: values.lastName,
    licenseNumber: values.licenseNumber,
    office: values.office,
    schedule: values.schedule,
    specialty: values.specialty,
  }
}

export function toUpdateDoctorInput(values: DoctorFormValues): UpdateDoctorInput {
  return {
    ...toCreateDoctorInput(values),
    isActive: values.isActive,
  }
}

export function getDoctorFormDefaultValues(doctor?: Doctor): DoctorFormValues {
  return {
    experienceYears: doctor?.experienceYears ?? 0,
    firstName: doctor?.firstName ?? "",
    isActive: doctor?.isActive ?? true,
    lastName: doctor?.lastName ?? "",
    licenseNumber: doctor?.licenseNumber ?? "",
    office: doctor?.office ?? "",
    schedule: doctor?.schedule.length ? doctor.schedule.map(toFormShift) : [defaultShift],
    specialty: doctor?.specialty ?? "",
  }
}

function toFormShift(shift: DoctorScheduleShift) {
  return {
    day: normalizeDoctorDay(shift.day),
    endTime: toTimeInputValue(shift.endTime),
    startTime: toTimeInputValue(shift.startTime),
  }
}

function toTimeInputValue(value: string) {
  return value.match(/^\d{2}:\d{2}/)?.[0] ?? value
}
