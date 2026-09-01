import { afterEach, describe, expect, it, vi } from "vitest"

import { apiRequest } from "@/lib/api/client"
import {
  createMedicalRecord,
  getMedicalRecord,
  getPatientMedicalRecords,
  searchClinicalHistory,
} from "@/features/medical-records/api/medical-records-api"
import type { CreateMedicalRecordInput } from "@/features/medical-records/types"

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

afterEach(() => {
  vi.clearAllMocks()
})

describe("medical records api", () => {
  it("uses the search, patient history and detail routes with encoded identifiers", async () => {
    apiRequestMock.mockResolvedValue([])

    await searchClinicalHistory("Ana López / 402")
    await getPatientMedicalRecords("patient/1")
    await getMedicalRecord("record/1")

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/medical-records/search?term=Ana+L%C3%B3pez+%2F+402")
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/medical-records/patient/patient%2F1")
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/medical-records/record%2F1")
  })

  it("sends the immutable clinical record command without form-only fields", async () => {
    const input: CreateMedicalRecordInput = {
      appointmentId: "appointment-1",
      diagnosis: "Hipertensión controlada",
      doctorId: "doctor-1",
      observations: "Paciente estable.",
      patientId: "patient-1",
      treatmentPlan: "Continuar seguimiento.",
      vitalSigns: {
        bloodPressure: "120/80",
        heartRate: 72,
        temperature: 36.7,
        weightKg: null,
      },
    }
    apiRequestMock.mockResolvedValue({ id: "record-1" })

    await createMedicalRecord(input)

    expect(apiRequestMock).toHaveBeenCalledWith("/api/medical-records", {
      body: JSON.stringify(input),
      method: "POST",
    })
  })
})
