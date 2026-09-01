import { describe, expect, it } from "vitest"

import {
  medicalRecordFormSchema,
  parseOptionalNumber,
} from "@/features/medical-records/schemas/medical-record-schemas"

describe("medical record schemas", () => {
  it("allows optional clinical notes and vital signs while requiring context and review confirmation", () => {
    const result = medicalRecordFormSchema.safeParse({
      appointmentId: "",
      bloodPressure: "120/80",
      diagnosis: "Consulta de seguimiento",
      doctorId: "doctor-1",
      heartRate: "",
      observations: "Sin hallazgos adicionales.",
      patientId: "patient-1",
      reviewed: true,
      temperature: "36.5",
      treatmentPlan: "Continuar controles.",
      weightKg: "",
    })

    expect(result.success).toBe(true)
  })

  it("rejects a record that was not reviewed and converts blank numbers to null", () => {
    const result = medicalRecordFormSchema.safeParse({
      appointmentId: "",
      bloodPressure: "120/80",
      diagnosis: "Consulta",
      doctorId: "doctor-1",
      heartRate: "72",
      observations: "Observaciones",
      patientId: "patient-1",
      reviewed: false,
      temperature: "",
      treatmentPlan: "Seguimiento",
      weightKg: "70",
    })

    expect(result.success).toBe(false)
    expect(parseOptionalNumber("")).toBeNull()
    expect(parseOptionalNumber(" 36.5 ")).toBe(36.5)
  })

  it("rejects a fractional heart rate that the backend cannot deserialize as an integer", () => {
    const result = medicalRecordFormSchema.safeParse({
      appointmentId: "",
      bloodPressure: "120/80",
      diagnosis: "Consulta",
      doctorId: "doctor-1",
      heartRate: "72.5",
      observations: "",
      patientId: "patient-1",
      reviewed: true,
      temperature: "",
      treatmentPlan: "",
      weightKg: "",
    })

    expect(result.success).toBe(false)
  })
})
