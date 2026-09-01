import { describe, expect, it } from "vitest"

import { doctorFormSchema, type DoctorFormValues } from "@/features/doctors/schemas/doctor-schemas"
import { toCreateDoctorInput, toUpdateDoctorInput } from "@/features/doctors/utils/doctor-form"

const formValues: DoctorFormValues = {
  experienceYears: 6,
  firstName: "Herminia",
  isActive: true,
  lastName: "Médico",
  licenseNumber: "LIC-001",
  office: "Consultorio 108",
  schedule: [
    { day: "Monday", endTime: "11:00", startTime: "08:00" },
    { day: "Wednesday", endTime: "16:00", startTime: "13:00" },
  ],
  specialty: "Medicina General",
}

describe("doctor form", () => {
  it("requires a valid schedule with start before end", () => {
    const result = doctorFormSchema.safeParse({
      ...formValues,
      schedule: [{ day: "Monday", endTime: "08:00", startTime: "09:00" }],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toContain("schedule.0.endTime")
    }
  })

  it("maps schedule values to the create and update contracts", () => {
    expect(toCreateDoctorInput(formValues)).toEqual({
      experienceYears: 6,
      firstName: "Herminia",
      lastName: "Médico",
      licenseNumber: "LIC-001",
      office: "Consultorio 108",
      schedule: [
        { day: "Monday", endTime: "11:00", startTime: "08:00" },
        { day: "Wednesday", endTime: "16:00", startTime: "13:00" },
      ],
      specialty: "Medicina General",
    })
    expect(toUpdateDoctorInput({ ...formValues, isActive: false })).toMatchObject({ isActive: false })
  })
})
