import { describe, expect, it } from "vitest"

import { nursingVitalsFormSchema, parseOptionalNumber } from "@/features/nursing/schemas/nursing-vitals-schemas"

describe("nursing vitals schemas", () => {
  it("requires at least one measured vital sign", () => {
    const result = nursingVitalsFormSchema.safeParse({
      appointmentId: "",
      bloodPressure: "",
      heartRate: "",
      notes: "",
      patientId: "patient-1",
      temperature: "",
      weightKg: "",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === "Registra al menos un signo vital.")).toBe(true)
    }
  })

  it("keeps optional values as strings until the API payload is built", () => {
    const result = nursingVitalsFormSchema.safeParse({
      appointmentId: "",
      bloodPressure: "120/80",
      heartRate: "72",
      notes: "Sin novedades.",
      patientId: "patient-1",
      temperature: "36.7",
      weightKg: "",
    })

    expect(result.success).toBe(true)
    expect(parseOptionalNumber(" 36.7 ")).toBe(36.7)
    expect(parseOptionalNumber("")).toBeNull()
  })
})
