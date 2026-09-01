export interface DoctorScheduleShift {
  day: string
  startTime: string
  endTime: string
}

export interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialty: string
  licenseNumber: string
  experienceYears: number
  office: string
  schedule: DoctorScheduleShift[]
  isActive: boolean
}

export interface CreateDoctorInput {
  firstName: string
  lastName: string
  specialty: string
  licenseNumber: string
  experienceYears: number
  office: string
  schedule: DoctorScheduleShift[]
}

export interface UpdateDoctorInput extends CreateDoctorInput {
  isActive: boolean
}
