import { afterEach, describe, expect, it, vi } from "vitest"

import { apiRequest } from "@/lib/api/client"
import { createVitalsRecord, getPatientVitals } from "@/features/nursing/api/nursing-api"
import type { CreateVitalsRecordInput } from "@/features/nursing/types"

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

afterEach(() => {
  vi.clearAllMocks()
})

describe("nursing api", () => {
  it("uses the patient vitals route and encodes patient identifiers", async () => {
    apiRequestMock.mockResolvedValue([])

    await getPatientVitals("patient/1")

    expect(apiRequestMock).toHaveBeenCalledWith("/api/nursing/vitals/patient/patient%2F1")
  })

  it("does not send the session-derived recordedBy field", async () => {
    const input: CreateVitalsRecordInput = {
      appointmentId: null,
      notes: "Medición en reposo.",
      patientId: "patient-1",
      vitalSigns: {
        bloodPressure: "120/80",
        heartRate: 72,
        temperature: null,
        weightKg: null,
      },
    }
    apiRequestMock.mockResolvedValue({ id: "vitals-1" })

    await createVitalsRecord(input)

    expect(apiRequestMock).toHaveBeenCalledWith("/api/nursing/vitals", {
      body: JSON.stringify(input),
      method: "POST",
    })
  })
})
